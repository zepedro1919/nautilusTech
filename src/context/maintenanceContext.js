import React, { createContext, useState, useEffect, useContext, useReducer, useMemo } from "react";

export const MaintenanceContext = createContext();

export const MaintenanceProvider = ({ children }) => {
    const [alerts, setAlerts] = useState([]);
    const storedUser = JSON.parse(localStorage.getItem("user")) || {};
    const userId = storedUser?.id || null;

    const fetchMaintenanceAlerts = () => {
        fetch(`http://localhost:5000/maintenance-alerts?userId=${userId}`)
        .then((res) => res.json())
        .then((data) => {
            setAlerts(data);
        })
        .catch((err) => console.error("Error fetching maintenance alerts:", err))
    };

    useEffect(() => {
        fetchMaintenanceAlerts();
        const interval = setInterval(fetchMaintenanceAlerts, 10000); // Fetch maintenanceAlerts every 10 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <MaintenanceContext.Provider value={{ alerts }}>
            {children}
        </MaintenanceContext.Provider>
    );
};