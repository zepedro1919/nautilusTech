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

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [machines, setMachines] = useState([]);
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser ? storedUser.id : null
  console.log("userId:", userId);

  useEffect(() => {
    try {
      fetch(`http://localhost:5000/machines?userId=${userId}`)
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
    } catch (error) {
        console.error("Fetch error:", error);
    }
  }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mt={4.5}>
        <Grid container spacing={3}>
          {(Array.isArray(machines) ? machines : []).map((machine) => (
            <Grid item xs={12} md={6} lg={4} key={machine.id}>
              <Card sx={{ p: 2, textAlign: "center", boxShadow: 3, cursor: "pointer", transition: "transform 0.5s ease-in-out",
                      "&:hover": {
                        transform: "scale(1.05)",
                      }, }} onClick={() => navigate(`/machines/${machine.id}`)} >
                <MDBox
                  component="img"
                  src={machine.machine_photo_url}
                  alt={machine.name}
                  width="100%"
                  height="300px"
                  sx=
                  {{ 
                    objectFit: "cover", 
                    borderRadius: "10px",
                  }}
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
