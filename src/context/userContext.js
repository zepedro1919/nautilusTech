import { createContext, useState, useEffect } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem("user");
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const [maintenanceScore, setMaintenanceScore] = useState(user?.maintenanceScore || "N/A");

    const fetchAndUpdateScore = async () => {
        try {
            let storedUser = JSON.parse(localStorage.getItem("user"));

            if (!storedUser || !storedUser.id) {
                console.error("No user found in localStorage");
                return;
            }

            // Update maintenance scores in the database
            await fetch("http://localhost:5000/api/update-maintenance-scores", { method: "GET" });

            // Fetch updated user info
            const response = await fetch(`http://localhost:5000/api/user/${storedUser.id}`);
            const updatedUser = await response.json();

            if (updatedUser.maintenanceScore) {
                console.log("Updated Maintenance Score:", updatedUser.maintenanceScore);

                // Let's update the localStorage and state
                storedUser.maintenanceScore = updatedUser.maintenanceScore;
                localStorage.setItem("user", JSON.stringify(storedUser));

                setUser(storedUser);
                setMaintenanceScore(updatedUser.maintenanceScore);
            }
        } catch (error) {
            console.log("Error updating maintenance score:", error)
        }
    };

    return (
        <UserContext.Provider value={{ user, maintenanceScore, fetchAndUpdateScore }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserContext;