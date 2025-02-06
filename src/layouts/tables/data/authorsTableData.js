/* eslint-disable react/prop-types */
/* eslint-disable react/function-component-definition */
/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";
import MDBadge from "components/MDBadge";

// Images
import team2 from "assets/images/team-2.jpg";
import team3 from "assets/images/team-3.jpg";
import team4 from "assets/images/team-4.jpg";

// Function to format duration as Days:Hours:Minutes:Seconds
const formatDuration = (seconds) => {
  console.log("SECONDS", seconds);
  if (!seconds || isNaN(seconds)) return "0s";
  let h = Math.floor((seconds % (3600 * 24)) / 3600);
  let m = Math.floor((seconds % 3600) / 60);
  let s = seconds % 60;

  return `${h}h ${m}m ${s}s`;
};

// Fetch machine usage logs
export default async function fetchMachineLogs() {
  try {

    const response = await fetch("http://localhost:5000/machine-usage", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    };

    const logs = await response.json();
    console.log("Fetched usage logs:", logs);

    return {
      columns: [
        { Header: "User", accessor: "user", align: "center" },
        { Header: "Machine", accessor: "machine_name", align: "center" },
        { Header: "Start Time", accessor: "start_time", align: "center" },
        { Header: "End Time", accessor: "stop_time", align: "center" },
        { Header: "Duration", accessor: "duration", align: "center" },
      ],

      rows:  logs.map(log => ({
        user: (
          <MDTypography variant="caption" fontWeight="medium">
            {log.user_name}
          </MDTypography>
        ),
        machine_name: (
          <MDTypography variant="caption" fontWeight="medium">
            {log.machine_name}
          </MDTypography>
        ),
        start_time: (
          <MDTypography variant="caption" color="text">
            {log.start_time}
          </MDTypography>
        ),
        stop_time: (
          <MDTypography variant="caption" color="text">
            {log.stop_time}
          </MDTypography>
        ),
        duration: (
          <MDTypography variant="caption" color="text">
            {formatDuration(log.duration_seconds)}
          </MDTypography>
        ),
      })),
    };
  } catch (error) {
    console.error("Error fetching machine usage logs:", error);
    return { columns: [], rows: [] };
  }
}
