import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import UserContext from "context/userContext";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDAlert from "components/MDAlert";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

function Notifications() {
  const [alerts, setAlerts] = useState([]);
  const navigate  = useNavigate();
  const { fetchAndUpdateScore } = useContext(UserContext);

  const maintenanceRealization = async (alertId, machineId, machineName, maintenanceType, machinePhotoUrl) => {
    try {
      navigate('/maintenance-tracker', {
        state: { alertId, machineId, machineName, maintenanceType, machinePhotoUrl }
      });
    } catch (error) {
      console.error("Failed to resolve alert:", error);
    }
  };

  const dismissAlert = async (alertId) => {
    console.log(`Dismissing alert with ID: ${alertId}`);
    setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== alertId));
  };

  useEffect(() => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        const userId = storedUser ? storedUser.id : null;

        if (!userId) {
          console.error("User Id is missing in localStorage");
        } else {
          fetch(`http://localhost:5000/maintenance-alerts?userId=${userId}`)
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) {
              setAlerts(data);
            } else {
              console.log("Expected array but got:", data);
            }
          })
          .catch((err) => console.error("Error fetching maintenance alerts:", err));
        }
      } catch (error) {
        console.error("Error fetching maintenance alerts:", error);
      }

  }, []);

  useEffect(() => {
    // Event listener function to handle resolved alerts
    const handleAlertResolved = (event) => {
      const resolvedAlertId = event.detail; // Extract alertId from event
      console.log("📩 Alert Resolved Event Fired, ID:", resolvedAlertId);

      fetchAndUpdateScore();

      dismissAlert(resolvedAlertId); // Call dismissAlert when an alert is resolved
    };

    // Attach the event listener to listen for "alertResolved" events
    console.log("🔄 Adding event listener for alertResolved");
    window.addEventListener("alertResolved", handleAlertResolved);

    // Cleanup function: Remove event listener when component unmounts
    return () => {
      window.removeEventListener("alertResolved", handleAlertResolved);
    };
  },[]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mt={6} mb={3}>
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} lg={8}>
            <Card>
              <MDBox p={2}>
                <MDTypography variant="h5">Maintenance Alerts</MDTypography>
              </MDBox>
              <MDBox pt={2} px={2}>
                {alerts.map((alert) => (
                  <MDAlert 
                    key={alert.id} 
                    color="warning" 
                    dismissible
                    onClick={() => {
                      maintenanceRealization(alert.id, alert.machine_id, alert.machine_name, alert.maintenance_type, alert.machine_photo_url);
                    }}
                    sx={{
                      cursor: "pointer",
                      transition: "transform 0.5s ease-in-out",
                      "&:hover": {
                        transform: "scale(1.02)",
                      },
                    }}
                  >
                    <p>{alert.alert_message}</p>
                  </MDAlert>
                ))}
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Notifications;
