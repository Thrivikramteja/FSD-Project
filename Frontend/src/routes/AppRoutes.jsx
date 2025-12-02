import { Routes, Route } from "react-router-dom";
import LandingPage from "../pages/Landingpage";
import DiscoverPage from "../pages/Discoverpage";
import LoginPage from "../pages/Loginpage";
import Signup from "../pages/Signuppage"
import DonorDashboard from "../dashboards/userDashboard";
import NGODashboard from "../pages/NGODashboard";
import CreateFundraiser  from "../pages/CreateFundraiser";
import WaysToHelpPage from "../pages/WaysToHelpPage";
import DonateItemsPage from "../pages/DonateItemsPage";
import DonateMoneyPage from "../pages/DonateMoneyPage";
import ListJobPage from "../pages/ListJobPage";
import CarehomeDashboard from "../pages/CarehomeDashboard";
import CreateJob from "../pages/createJob";
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
      <Route path="/ways-to-help" element={<WaysToHelpPage />} />
      <Route path="/donate-items" element={<DonateItemsPage />} />
      <Route path="/donate-funds" element={<DonateMoneyPage />} />
      <Route path="/jobs" element={<ListJobPage />} />

      <Route path="/NGO-dashboard/:ngoID" element={<NGODashboard />} />

      <Route 
        path="/NGO-dashboard/:ngoID/create-fundraiser" 
        element={<CreateFundraiser />} 
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
      <Route 
        path="/carehome-dashboard/:careid" 
        element={<CarehomeDashboard />} 
      />
      <Route path="/carehome-dashboard/get-job" element={<CreateJob />} />
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
