import { Routes, Route } from "react-router-dom";
import LandingPage from "../pages/Landingpage";
import DiscoverPage from "../pages/Discoverpage";
import LoginPage from "../pages/Loginpage";
import Signup from "../pages/Signuppage"
import DonorDashboard from "../dashboards/userDashboard";
import NGODashboard from "../pages/NGODashboard";
import CreateFundraiser  from "../pages/CreateFundraiser";
import CreateEvent from "../pages/CreateEvent";
// import OrphanageDashboard from "../pages/OrphanageDashboard";
// import AdminDashboard from "../pages/AdminDashboard";
import ProtectedRoute from "./ProtectedRoute";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/discover" element={<DiscoverPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/NGO-dashboard/:ngoID" element={<NGODashboard />} />

      <Route 
        path="/NGO-dashboard/:ngoID/create-fundraiser" 
        element={<CreateFundraiser />} 
      />

      <Route 
        path="/NGO-dashboard/:ngoID/create-event" 
        element={<CreateEvent />} 
      />
      
      {/* Protected Routes */}
      <Route
        path="/donor-dashboard/:id"
        element={
          <ProtectedRoute allowedRoles={["Donor"]}>
            <DonorDashboard />
          </ProtectedRoute>
        }
      />

      {/* <Route
        path="/ngo-dashboard"
        element={
          <ProtectedRoute allowedRoles={["ngo"]}>
            <NgoDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/carehome-dashboard"
        element={
          <ProtectedRoute allowedRoles={["orphanage"]}>
            <OrphanageDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />*/}

      {/* Fallback route */}
      {/* <Route path="*" element={<LandingPage />} /> */}
    </Routes>
  );
};

export default AppRoutes;
