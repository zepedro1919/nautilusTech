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

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDAlert from "components/MDAlert";
import MDButton from "components/MDButton";
import MDSnackbar from "components/MDSnackbar";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

function Notifications() {
  const [alerts, setAlerts] = useState([]);
  const navitate  = useNavigate();

  const dismissAlert = async (alertId) => {
    setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== alertId));
  };

  const resolveAlert = async (alertId) => {
    try {
      await fetch(`http://localhost:5000/resolve-alert/${alertId}`, { method: "PUT" });
      dismissAlert(alertId); // Remove from UI
    } catch (error) {
      console.error("Failed to resolve alert:", error);
    }
  };

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await axios.get("http://localhost:5000/maintenance-alerts");
        console.log("API Response:", response.data);
        setAlerts(response.data);
      } catch (error) {
        console.error("Error fetching maintenance alerts:", error);
      }
    };

    fetchAlerts();
  }, []);

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
                  <MDAlert key={alert.id} color="warning" dismissible>
                    <p>{alert.alert_message}</p>
                    <button onClick={() => resolveAlert(alert.id)}>Resolve</button>
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
