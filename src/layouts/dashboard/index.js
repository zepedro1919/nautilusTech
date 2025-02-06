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

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";
import ReportsLineChart from "examples/Charts/LineCharts/ReportsLineChart";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";

// Data
import reportsBarChartData from "layouts/dashboard/data/reportsBarChartData";
import reportsLineChartData from "layouts/dashboard/data/reportsLineChartData";

// Dashboard components
import Projects from "layouts/dashboard/components/Projects";
import OrdersOverview from "layouts/dashboard/components/OrdersOverview";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [machines, setMachines] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/machines")
      .then((res) => {
        console.log("Fetch Response:", res);
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.text(); // Get raw text response
      })
      .then((text) => {
        console.log("Raw Response Text:", text);
        return text ? JSON.parse(text) : [];
      })
      .then((data) => {
        console.log("Parsed Data:", data);
        setMachines(data);
      })
      .catch((error) => {
        console.error("Fetch error:", error);
      });
  }, []);
  console.log("Machines state:", machines);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mt={4.5}>
        <Grid container spacing={3}>
          {(Array.isArray(machines) ? machines : []).map((machine) => (
            <Grid item xs={12} md={6} lg={4} key={machine.id}>
              <Card sx={{ p: 2, textAlign: "center", boxShadow: 3, cursor: "pointer" }} onClick={() => navigate(`/machines/${machine.id}`)}>
                <MDBox
                  component="img"
                  src={machine.machine_photo_url}
                  alt={machine.name}
                  width="100%"
                  height="200px"
                  sx={{ objectFit: "cover", borderRadius: "10px" }}
                />
                <MDTypography variant="h6" mt={2}>
                  {machine.name}
                </MDTypography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Dashboard;
