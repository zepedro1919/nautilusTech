import React, { useEffect, useState, useContext } from "react";
import { MaintenanceContext } from "context/maintenanceContext";
import { Snackbar, Alert } from "@mui/material";

const MaintenanceAlertPopup = () => {
  const { alerts } = useContext(MaintenanceContext);
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!Array.isArray(alerts) || alerts.length === 0) {
      return;
    }

    setOpen(true);

    const interval = setInterval(() => {
      setOpen(false);
      setTimeout(() => {
        setCurrentAlertIndex((prevIndex) => (prevIndex + 1) % alerts.length); // Moves to the next alert
        setOpen(true);
      }, 500); // delay before next alert appears
    }, 3000); // Change alert every 3 seconds

    return () => clearInterval(interval);
  }, [alerts]);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
        {Array.isArray(alerts) && alerts.length > 0 && (
          <Snackbar key={alerts[currentAlertIndex]?.id} open={open} onClose={handleClose} autoHideDuration={2500}>
            <Alert severity="warning" variant="filled">
              {alerts[currentAlertIndex]?.alert_message}
            </Alert>
          </Snackbar>
        )}
    </>
  );
};

export default MaintenanceAlertPopup;