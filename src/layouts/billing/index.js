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

// Material Dashboard 2 React components
import MDBox from "components/MDBox";

// Material Dashboard 2 React examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MasterCard from "examples/Cards/MasterCard";
import DefaultInfoCard from "examples/Cards/InfoCards/DefaultInfoCard";

// Billing page components
import PaymentMethod from "layouts/billing/components/PaymentMethod";
import Invoices from "layouts/billing/components/Invoices";
import BillingInformation from "layouts/billing/components/BillingInformation";
import Transactions from "layouts/billing/components/Transactions";

import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import { Card, Button, Typography } from "@mui/material";
import { MaintenanceContext } from "context/index";
import { Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";

function MachineDetail() {
  const { id } = useParams(); // Get machine ID from URL
  const [machine, setMachine] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch machine details from backend
    fetch(`http://localhost:5000/machines/${id}`)
      .then((res) => res.json())
      .then((data) => setMachine(data))
      .catch((err) => console.error("Error fetching machine details:", err));
  }, [id]);

  useEffect(() => {
    let interval;

    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prevTime => prevTime + 1); // Increment elapsed time every second
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isRunning]);

  // Start the timer
  const handleStart = () => {
    setIsRunning(true);
    setStartTime(Math.floor(Date.now()/1000));
  };

  // Stop timer
  const handleStop = () => {
    setIsRunning(false);
  };

  // Save Session Data
  const handleDone = () => {
    handleStop();

    const sessionData = {
      machineId: id,
      userId: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).id : null,
      startTime,
      endTime: Math.floor(Date.now()/1000),
      duration: elapsedTime,
    };

    fetch("http://localhost:5000/machine-usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sessionData),
    })
      .then((res) => res.json())
      .then((data) => console.log("Usage logged:", data))
      .catch((err) => console.error("Error saving session:", err));

    navigate('/machines');
  };

  return machine ? (
    <>
      <Card sx={{ p: 4, textAlign: "center", maxWidth: 500, margin: "auto" }}>
      <img
        src={machine.machine_photo_url}
        alt={machine.name}
        style={{ width: "100%", height: "auto" }}
      />
      <Typography variant="h5">{machine.name}</Typography>
      <Typography variant="body1">{machine.description}</Typography>

      <Typography variant="h6" mt={2}>
        Elapsed Time: {elapsedTime} seconds
      </Typography>

      <Button variant="contained" color="success" onClick={handleStart} disabled={isRunning}>
        Start
      </Button>
      <Button variant="contained" color="warning" onClick={handleStop} disabled={!isRunning}>
        Stop
      </Button>
      <Button variant="contained" color="error" onClick={handleDone}>
        Acabei
      </Button>
    </Card>
    </>
  ) : (
    <Typography>Loading Machine Details...</Typography>
  );
}

export default MachineDetail;
