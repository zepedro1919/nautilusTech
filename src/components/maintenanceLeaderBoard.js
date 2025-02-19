import React, { useState, useEffect } from "react";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import Avatar from "@mui/material/Avatar";

const MaintenanceLeaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);

    useEffect(() => {
        const fetchLeaderboard = async() => {
            try {
                const response = await fetch("http://localhost:5000/api/maintenance-leaderboard");
                const data = await response.json();
                setLeaderboard(data);
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            }
        };
        fetchLeaderboard();
    }, []);

    const getScoreColor = (score) => {
        if (["A+", "A", "A-"].includes(score)) return "#4CAF50"; // green
        if (["B+", "B", "B-", "C+", "C", "C-"].includes(score)) return "#FFC107"; // yellow
        return "#F44336"; // red
    };

    return (
        <MDBox sx={{ width: "300px", ml: 4 }}>
            <MDTypography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
            🏆 Maintenance Leaderboard
            </MDTypography>
            {leaderboard.map((user, index) => (
                <MDBox 
                    key={user.id} 
                    sx={{ display: "flex", alignItems: "center", mb: 1, p: 1, borderRadius: "5px", backgroundColor: "#f5f5f5" }}
                >
                    <MDTypography variant="h6" sx={{ width: "30px", textAlign: "center" }}>
                        {index + 1}.
                    </MDTypography>
                    <Avatar src={user.photo} sx={{ width: 40, height: 40, mr: 2 }} />
                    <MDTypography variant="h6" sx={{ flexGrow: 1 }}>{user.name}</MDTypography>
                    <MDTypography variant="h6" sx={{ fontWeight: "bold", color: getScoreColor(user.maintenance_score) }}>
                        {user.maintenance_score}
                    </MDTypography>
                </MDBox>
            ))}
        </MDBox>
    );
};

export default MaintenanceLeaderboard;