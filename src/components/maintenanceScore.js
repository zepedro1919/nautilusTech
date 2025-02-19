import React from "react";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { CircularProgress, Box } from "@mui/material";

// Map scores to progress percentage
const getScorePercentage = (score) => {
    const scoreMap = {
        "A+": 100, "A": 95, "A-": 90,
        "B+": 80, "B": 75, "B-": 70,
        "C+": 60, "C": 50, "C-": 40,
        "D+": 30, "D": 20, "D-": 10
    };
    return scoreMap[score] || 0;
};

// Determine the color based on the score
const getScoreColor = (score) => {
    if (["A+", "A", "A-"].includes(score)) return "#4CAF50"; // green
    if (["B+", "B", "B-", "C+", "C", "C-"].includes(score)) return "#FFC107"; // yellow
    return "#F44336"; // red
};

const MaintenanceScore = ({ score }) => {
    const percentage = getScorePercentage(score);
    const color = getScoreColor(score);

    return (
        <MDBox sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 4 }}>
            <MDTypography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                Maintenance Score
            </MDTypography>

            <Box sx={{ position: "relative", display: "inline-flex" }}>
                {/* Circular Progress */}
                <CircularProgress 
                    variant="determinate" 
                    value={percentage} 
                    size={120} 
                    thickness={8} 
                    sx={{ color: color }} 
                />

                {/* Score Inside the Circle */}
                <Box
                    sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: "absolute",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <MDTypography variant="h4" sx={{ fontWeight: "bold", color: color }}>
                        {score}
                    </MDTypography>
                </Box>
            </Box>
        </MDBox>
    );
};

export default MaintenanceScore;