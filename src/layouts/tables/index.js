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
import DataTable from "examples/Tables/DataTable";

// Data
import fetchMachineLogs from "layouts/tables/data/authorsTableData";
import fetchMaintenanceLogs from "layouts/tables/data/projectsTableData";

import React, { useState, useEffect } from "react";

const MachineUsageTable = () => {
  const [ usageData, setUsageData ] = useState({ columns: [], rows: [] });
  const [maintenanceLogs, setMaintenanceLogs] = useState({ columns: [], rows: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const logs = await fetchMachineLogs();
        setUsageData(prevData => {
          if (JSON.stringify(prevData) !== JSON.stringify(logs)) {
            return logs;
          }
          return prevData;
        });
      } catch (err) {
        console.error("Error fetching machine logs:", err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchMaintenanceData = async () => {
      try {
        const logs = await fetchMaintenanceLogs();
        setMaintenanceLogs(prevData => {
          if (JSON.stringify(prevData) !== JSON.stringify(logs)) {
            return logs;
          }
          return prevData;
        });
      } catch (error) {
        console.error("Error fetching maintenance logs:", error);
      }
    };

    fetchMaintenanceData();
  }, []);

  const { columns, rows } = usageData;
  const { columns: maintenanceColumns, rows: maintenanceRows } = maintenanceLogs;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
              >
                <MDTypography variant="h6" color="white">
                  Usage Logs
                </MDTypography>
              </MDBox>
              <MDBox pt={3}>
                <DataTable
                  table={{ columns, rows }}
                  isSorted={false}
                  entriesPerPage={false}
                  showTotalEntries={false}
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
              >
                <MDTypography variant="h6" color="white">
                  Maintenance Logs
                </MDTypography>
              </MDBox>
              <MDBox pt={3}>
                <DataTable
                  table={{ columns: maintenanceColumns, rows: maintenanceRows }}
                  isSorted={false}
                  entriesPerPage={false}
                  showTotalEntries={false}
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default MachineUsageTable;
