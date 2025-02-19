import React, { useContext, useEffect, useState } from "react";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Overview page components
import Header from "layouts/profile/components/Header";

import UserContext from "context/userContext";
import MaintenanceScore from "components/maintenanceScore";
import MaintenanceLeaderboard from "components/maintenanceLeaderBoard";

function UserProfile() {
  
  const {user, maintenanceScore, fetchAndUpdateScore} = useContext(UserContext);

  useEffect(() => {
    fetchAndUpdateScore();
  }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mb={2} />
      {/* Add a loading state OR a fallback before accessing user properties */}
      {user ? (
        <Header name={user.name} position={user.position} profilePhoto={user.profilePhoto}>
            <MDBox display="flex">
              <MDBox flex={1}>
                < MaintenanceScore score={maintenanceScore} />
              </MDBox>
              <MDBox flex={2}>
                <MaintenanceLeaderboard/>
              </MDBox>
            </MDBox>
            
        </Header>
      ) : (
        <p>Loading...</p> // This preserves crashes when user is null (JSX renders before useEffect updates user) so it crashes when trying to access user.name, ...
      )}

      <Footer />
    </DashboardLayout>
  );
}

export default UserProfile;
