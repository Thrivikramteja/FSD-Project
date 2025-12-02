import { Routes, Route } from "react-router-dom";
import LandingPage from "../pages/Landingpage";
import DiscoverPage from "../pages/Discoverpage";
import LoginPage from "../pages/Loginpage";
import Signup from "../pages/Signuppage";
import DonorDashboard from "../dashboards/userDashboard";
// import NgoDashboard from "../pages/NgoDashboard";
// import OrphanageDashboard from "../pages/OrphanageDashboard";
// import AdminDashboard from "../pages/AdminDashboard";
import AllCarehomes from "../pages/AllCarehomes"; 
import AllNgos from "../pages/AllNgos";
import AllEvents from "../pages/AllEvents";
import AllFundraisers from "../pages/AllFundraisers";
import ProtectedRoute from "./ProtectedRoute";
import DonorRegistration from "../pages/DonorRegistration";
import ViewCare from "../pages/ViewCare";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/discover" element={<DiscoverPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<Signup />} />

       <Route path="/carehomes" element={<AllCarehomes />} />
      <Route path="/all-ngos" element={<AllNgos />} />
      <Route path="/events" element={<AllEvents />} />
      <Route path="/fundraisers" element={<AllFundraisers />} />
      <Route path="/register-event/:ngoId/:eventName" element={<DonorRegistration />} />
      <Route path="/carehomes/viewcare/:carehomeId" element={<ViewCare />} />
      

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
