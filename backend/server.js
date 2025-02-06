require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg"); // this is relative to the postgresql client

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const MAINTENANCE_THRESHOLD_HOURS = 100; // threshold = limite

app.get('/machines', async (req, res) => {
  try {
    const machines = await pool.query("SELECT * FROM machines");
    console.log("Machines from DB:", machines.rows);
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
    const result = await pool.query(`
      SELECT ma.id, ma.machine_id, m.name AS machine_name, ma.alert_message, ma.created_at
      FROM maintenance_alerts ma
      JOIN machines m ON ma.machine_id = m.id
      WHERE ma.resolved = false
      ORDER BY ma.created_at DESC
    `);
    console.log("Fetched Alerts from DB:", result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
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

    console.log("User object:", user);
    res.json({ token, user: { id: user.id, name: user.name, position: user.position, profilePhoto: user.photo } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post('/machines/:id/maintenance', async (req, res) => {
  const { id } = req.params;
  const { user_id, description, next_due_date } = req.body;

  await pool.query(
    "INSERT INTO maintenance_logs (machine_id, user_id, description, next_due_date) VALUES ($1, $2, $3, $4)",
    [id, user_id, description, next_due_date]
  );

  await pool.query("UPDATE machines SET last_maintenance_date = NOW() WHERE id = $1", [id]);
  
  res.json({ message: "Maintenance logged successfully" });
});

app.post("/machine-usage", async (req, res) => {
  try {
    const { machineId, userId, startTime, endTime, duration } = req.body;

    console.log("Received data:", req.body);

    // Insert usage session
    await pool.query(
      `INSERT INTO machine_usage (machine_id, user_id, start_time, stop_time, duration)
      VALUES ($1, $2, to_timestamp($3), to_timestamp($4), $5) RETURNING *`,
      [machineId, userId, startTime, endTime, duration]
    );

    // Trigger maintenance check
    await fetch("http://localhost:5000/check-maintenance", { method: "POST" });

    res.json({ message: "Usage logged and maintenance checked" });
  } catch (err) {
    console.error("Error logging machine usage:", err);
    res.status(500).json({ err: "Internal Server Error", details: err.message });
  }
});

app.post("/check-maintenance", async (req, res) => {
  try {
    // Get all predefined maintenance intervals for this machine
    const maintenanceIntervals = await pool.query(`
      SELECT * FROM maintenance_intervals WHERE machine_id = 1  
    `);
    console.log("Fetched maintenance intervals:", maintenanceIntervals.rows);

    // Select the date of the date of the last resolved maintenance
    const result = await pool.query(`
      WITH last_maintenance AS (
        SELECT 
          machine_id, 
          maintenance_type,  -- Track each maintenance type separately
          COALESCE(MAX(resolved_at), '1970-01-01') AS last_resolved_at
        FROM maintenance_alerts 
        WHERE resolved = true
        GROUP BY machine_id, maintenance_type
      )
      SELECT 
        m.id, 
        m.name, 
        mi.maintenance_type,  -- Track each maintenance type
        lm.last_resolved_at, 
        SUM(EXTRACT(EPOCH FROM (mu.duration))) AS total_usage_since_last_maintenance
      FROM machine_usage mu
      JOIN machines m ON mu.machine_id = m.id
      JOIN maintenance_intervals mi ON mi.machine_id = m.id  -- Get predefined maintenance intervals
      LEFT JOIN last_maintenance lm 
        ON lm.machine_id = m.id AND lm.maintenance_type = mi.maintenance_type  -- Ensure correct maintenance type tracking
      WHERE mu.stop_time IS NOT NULL
        AND (lm.last_resolved_at IS NULL OR mu.start_time > lm.last_resolved_at) 
      GROUP BY m.id, mi.maintenance_type, lm.last_resolved_at, mi.interval_hours
      HAVING SUM(EXTRACT(EPOCH FROM (mu.duration))) >= mi.interval_hours;
    `);
    
    console.log("Machines that reached the maintenance threshold:", result.rows);
    
      
    for (const row of result.rows) {
      for (const interval of maintenanceIntervals.rows) {
        console.log("Interval:", interval);
        if (row.total_usage_since_last_maintenance >= interval.interval_hours) {
          console.log(`Checking alert for ${row.name} - ${interval.maintenance_type}`);
          // Check if an alert already exists for this interval
          const alertExists = await pool.query(
            `SELECT * FROM maintenance_alerts WHERE machine_id = $1 AND maintenance_type = $2 AND resolved = false`,
            [row.id, interval.maintenance_type]
          );

          if (alertExists.rows.length === 0) {
            console.log(`🔴 Creating maintenance alert for ${row.name} - ${interval.maintenance_type}`);
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

    res.json({ message: "Maintenance check completed." });
  } catch (error) {
    console.error("Error checking maintenance:", error);
    res.status(500).json({ error: "Failed to check maintenance" });
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

// Start server
app.listen(process.env.PORT, () => {
  console.log("Backend running on port 5000");
});
