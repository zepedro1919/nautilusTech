import React, { useEffect, useState, useContext } from "react";
import { MaintenanceContext } from "context/index";
import { Snackbar, Alert } from "@mui/material";

const MaintenanceAlertPopup = () => {
  const { alerts } = useContext(MaintenanceContext);
  const [openAlerts, setOpenAlerts] = useState({});

  useEffect(() => {
    // When new alerts are fetched, set them to open
    const newOpenAlerts = {};
    alerts.forEach((alert) => {
      newOpenAlerts[alert.id] = true;
    });
    setOpenAlerts(newOpenAlerts);
  }, [alerts]); // Runs every time alerts are updated

  const handleClose = (machineId) => {
    setOpenAlerts((prev) => ({ ...prev, [machineId]: false }));
  };

  return (
    <>
      {alerts.map((machine) => (
        <Snackbar key={machine.id} open={openAlerts[machine.id] ?? true} autoHideDuration={6000} onClose={() => handleClose(machine.id)}>
          <Alert severity="warning" variant="filled" onClose={() => handleClose(machine.id)}>
            {machine.alert_message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

export default MaintenanceAlertPopup;