require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg"); // this is relative to the postgresql client
const authenticateToken = require("./middleware/authMiddleware");

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
module.exports = pool;

app.get("/api/protected-data", authenticateToken, async (req, res) => {
  res.json({ message: "This is protected data!", user: req.user });
});

app.get('/machines', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const machines = await pool.query(`
        SELECT m.*
        FROM machines m
        JOIN machine_users mu ON m.id = mu.machine_id
        WHERE mu.user_id = $1
        ORDER BY m.id
    `, [userId]);

    console.log("Machines for user:", userId, machines.rows);
    res.json(machines.rows);
  } catch (error) {
    console.error("Error fetching machines:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/machines/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const machine = await pool.query("SELECT * FROM machines machines WHERE id = $1", [id]);
    res.json(machine.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/machine-usage", async (req, res) => {

  try {
    const result = await pool.query(
      `SELECT 
        u.name AS user_name,
        m.name AS machine_name,
        TO_CHAR(mu.start_time, 'DD/MM/YYYY, HH24:MI:SS') AS start_time,
        TO_CHAR(mu.stop_time, 'DD/MM/YYYY, HH24:MI:SS') AS stop_time,
        EXTRACT(EPOCH FROM mu.duration)::int AS duration_seconds
      FROM machine_usage mu
      JOIN users u ON mu.user_id = u.id
      JOIN machines m ON mu.machine_id = m.id
      ORDER BY mu.start_time DESC;`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching machine logs:", error);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

app.get("/maintenance-alerts", async (req, res) => {
  try {
    const { userId } = req.query;

    console.log("Received userId:", userId);

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const result = await pool.query(`
      SELECT DISTINCT ON (ma.id) ma.id, ma.machine_id, m.name AS machine_name, ma.alert_message, ma.created_at, ma.maintenance_type, m.machine_photo_url
      FROM maintenance_alerts ma
      JOIN machines m ON ma.machine_id = m.id
      JOIN machine_users mu ON m.id = mu.machine_id
      WHERE ma.resolved = false
      AND (mu.user_id = $1 OR m.is_general_use = true)
      ORDER BY ma.id, ma.created_at DESC;
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

app.get("/maintenance-logs", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ml.id, u.name AS user_name, m.name AS machine_name, ml.maintenance_type, TO_CHAR(ml.start_time, 'DD/MM/YYYY, HH24:MI:SS') AS start_time, TO_CHAR(ml.end_time, 'DD/MM/YYYY, HH24:MI:SS') AS end_time, ml.duration
      FROM maintenance_logs ml
      JOIN users u ON ml.user_id = u.id
      JOIN machines m ON ml.machine_id = m.id
      ORDER BY ml.start_time DESC;
    `);

    if (result.rows.length === 0) {
      res.json({ columns: [], rows: [] });
    } else {
      res.json(result.rows);
    }
  } catch (error) {
    console.error("Error fetching maintenance logs:", error);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

app.get("/api/update-maintenance-scores", async (req, res) => {
  try {
    await pool.query(`
      UPDATE users
      SET maintenance_score = CASE
        WHEN (
          SELECT COUNT(*) FROM maintenance_alerts ma
          JOIN machine_users mu ON ma.machine_id = mu.machine_id
          WHERE mu.user_id = users.id AND ma.resolved = false
        ) > 0 THEN 'D-'
        ELSE (
          SELECT CASE
            WHEN AVG(EXTRACT(EPOCH FROM (ma.resolved_at - ma.created_at))) <= 600 THEN 'A+'
            WHEN AVG(EXTRACT(EPOCH FROM (ma.resolved_at - ma.created_at))) <= 3600 THEN 'A'
            WHEN AVG(EXTRACT(EPOCH FROM (ma.resolved_at - ma.created_at))) <= 7200 THEN 'A-'
            WHEN AVG(EXTRACT(EPOCH FROM (ma.resolved_at - ma.created_at))) <= 14400 THEN 'B+'
            WHEN AVG(EXTRACT(EPOCH FROM (ma.resolved_at - ma.created_at))) <= 28800 THEN 'B'
            WHEN AVG(EXTRACT(EPOCH FROM (ma.resolved_at - ma.created_at))) <= 57600 THEN 'B-'
            WHEN AVG(EXTRACT(EPOCH FROM (ma.resolved_at - ma.created_at))) <= 115200 THEN 'C+'
            WHEN AVG(EXTRACT(EPOCH FROM (ma.resolved_at - ma.created_at))) <= 230400 THEN 'C'
            WHEN AVG(EXTRACT(EPOCH FROM (ma.resolved_at - ma.created_at))) <= 460800 THEN 'C-'
            WHEN AVG(EXTRACT(EPOCH FROM (ma.resolved_at - ma.created_at))) <= 921600 THEN 'D+'
            WHEN AVG(EXTRACT(EPOCH FROM (ma.resolved_at - ma.created_at))) <= 1843200 THEN 'D'
            ELSE 'D-'
          END
          FROM maintenance_alerts ma
          JOIN machine_users mu ON ma.machine_id = mu.machine_id
          WHERE mu.user_id = users.id AND ma.resolved = true
        )
      END;
    `);

    res.json({ message: "User maintenance scores updated!" });
  } catch (error) {
    console.error("Error updating scores:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/user/:id", async (req, res) => {
  const userId = req.params.id;

  if(!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      name: user.name,
      position: user.position,
      profilePhoto: user.photo,
      maintenanceScore: user.maintenance_score,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "server error" });
  }
})

app.get("/api/maintenance-leaderboard", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, photo, maintenance_score
      FROM users
      ORDER BY
        CASE
          WHEN maintenance_score = 'A+' THEN 1
          WHEN maintenance_score = 'A' THEN 2
          WHEN maintenance_score = 'A-' THEN 3
          WHEN maintenance_score = 'B+' THEN 4
          WHEN maintenance_score = 'B' THEN 5
          WHEN maintenance_score = 'B-' THEN 6
          WHEN maintenance_score = 'C+' THEN 7
          WHEN maintenance_score = 'C' THEN 8
          WHEN maintenance_score = 'C-' THEN 9
          WHEN maintenance_score = 'D+' THEN 10
          WHEN maintenance_score = 'D' THEN 11
          WHEN maintenance_score = 'D-' THEN 12
          ELSE 13
        END
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Login API
app.post("/api/login", async (req, res) => {
  console.log("Login request received:", req.body);

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Missing username or password" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT Token
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    console.log("Generated token:", token);
    console.log("JWT SECRET:", process.env.JWT_SECRET);

    res.json({
      token: token,
      user: { id: user.id, name: user.name, position: user.position, profilePhoto: user.photo, maintenanceScore: user.maintenance_score }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post('/machines/:id/maintenance', async (req, res) => {
  const { id } = req.params;

  await pool.query("UPDATE machines SET last_maintenance_date = NOW() WHERE id = $1", [id]);
  
  res.json({ message: "Maintenance logged successfully" });
});

app.post("/machine-usage", async (req, res) => {
  try {
    const { machineId, userId, startTime, endTime, duration } = req.body;

    // Insert usage session
    await pool.query(
      `INSERT INTO machine_usage (machine_id, user_id, start_time, stop_time, duration)
      VALUES ($1, $2, to_timestamp($3), to_timestamp($4), $5) RETURNING *`,
      [machineId, userId, startTime, endTime, duration]
    );

    // Trigger maintenance check
    await fetch(`http://localhost:5000/check-maintenance?machineId=${machineId}`, { method: "POST" });

    res.json({ message: "Usage logged and maintenance checked" });
  } catch (err) {
    console.error("Error logging machine usage:", err);
    res.status(500).json({ err: "Internal Server Error", details: err.message });
  }
});

app.post("/check-maintenance", async (req, res) => {
  console.log("Entered Check Maintenance");
  try {
    machineId = req.query.machineId;
    // Get all predefined maintenance intervals for this machine
    const maintenanceIntervals = await pool.query(`
      SELECT * FROM maintenance_intervals WHERE machine_id = $1  
    `, [machineId]);

    // Select the date of the date of the last resolved maintenance
    const result = await pool.query(`
      WITH last_maintenance AS (
        SELECT 
          machine_id, 
          maintenance_type,
          MAX(resolved_at) AS last_resolved_at
        FROM maintenance_alerts 
        WHERE resolved = true
        GROUP BY machine_id, maintenance_type
      )
      SELECT 
        m.id, 
        m.name, 
        mi.maintenance_type,
        lm.last_resolved_at, 
        SUM(EXTRACT(EPOCH FROM (mu.duration))) AS total_usage_since_last_maintenance
      FROM machine_usage mu
      JOIN machines m ON mu.machine_id = m.id
      JOIN maintenance_intervals mi ON mi.machine_id = m.id 
      LEFT JOIN last_maintenance lm 
        ON lm.machine_id = m.id AND lm.maintenance_type = mi.maintenance_type 
      WHERE mu.stop_time IS NOT NULL
        AND (lm.last_resolved_at IS NULL OR mu.start_time > lm.last_resolved_at)
      GROUP BY m.id, mi.maintenance_type, lm.last_resolved_at, mi.interval_hours
      HAVING SUM(EXTRACT(EPOCH FROM (mu.duration))) >= mi.interval_hours;
    `);
    
      
    for (const row of result.rows) {
      console.log("🚀 Maintenance check results:", result.rows);
      for (const interval of maintenanceIntervals.rows) {
        if (row.maintenance_type === interval.maintenance_type) {
          if (row.total_usage_since_last_maintenance >= interval.interval_hours) {
            // Check if an alert already exists for this interval
            const alertExists = await pool.query(
              `SELECT * FROM maintenance_alerts WHERE machine_id = $1 AND maintenance_type = $2 AND resolved = false`,
              [row.id, interval.maintenance_type]
            );

            if (alertExists.rows.length === 0) {
              // Insert new maintenance alert
              await pool.query(
                `INSERT INTO maintenance_alerts (machine_id, maintenance_type, alert_message, created_at, resolved)
                VALUES ($1, $2, $3, NOW(), false)`,
                [row.id, interval.maintenance_type, `Maintenance required for ${row.name} (${interval.maintenance_type})`]
              );
              console.log(`✅ Maintenance alert created for machine ${row.name} (${interval.maintenance_type})`);
            } else {
              console.log(`⚠️ Maintenance alert already exists for ${row.name} (${interval.maintenance_type})`);
            }
          }
        }
      }
    }

    res.json({ message: "Maintenance check completed." });
  } catch (error) {
    console.error("Error checking maintenance:", error);
    res.status(500).json({ error: "Failed to check maintenance" });
  }
});

app.post("/log-maintenance", async (req, res) => {
  try {
    const { machineId, userId, alertId, maintenanceType, startTime, endTime, duration } = req.body;

    await pool.query(
      `INSERT INTO maintenance_logs (machine_id, user_id, maintenance_alert_id, maintenance_type, start_time, end_time, duration)
      VALUES ($1, $2, $3, $4, to_timestamp($5), to_timestamp($6), $7)`,
      [machineId, userId, alertId, maintenanceType, startTime, endTime, duration]
    );

    res.json({ message: "Maintenance logged successfully" });
  } catch (error) {
    console.error("Error logging maintenance:", error);
    res.status(500).json({ error: "Failed to log maintenance" });
  }
});

// Used for updates
app.put ("/resolve-alert/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Mark maintenance as resolved
    await pool.query("UPDATE maintenance_alerts SET resolved = true, resolved_at = NOW() WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error resolving alert:", error);
    res.status(500).json({ error: "Failed to resolve alert" });
  }
});

const PORT = process.env.PORT || 5000;
// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
