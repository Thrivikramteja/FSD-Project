// import { Routes, Route } from "react-router-dom";
// import LandingPage from "../pages/Landingpage";
// import DiscoverPage from "../pages/Discoverpage";
// import LoginPage from "../pages/Loginpage";
// import Signup from "../pages/Signuppage";
// import DonorDashboard from "../dashboards/userDashboard";
// import NGODashboard from "../pages/NGODashboard";
// import CreateFundraiser from "../pages/CreateFundraiser";
// import CreateEvent from "../pages/CreateEvent";
// import WaysToHelpPage from "../pages/WaysToHelpPage";
// import DonateItemsPage from "../pages/DonateItemsPage";
// import DonateMoneyPage from "../pages/DonateMoneyPage";
// import ListJobPage from "../pages/ListJobPage";
// import CarehomeDashboard from "../pages/CarehomeDashboard";
// import EditProfile from "../pages/EditProfileCarehome";
// import CreateJob from "../pages/createJob";
// // import OrphanageDashboard from "../pages/OrphanageDashboard";
// // import AdminDashboard from "../pages/AdminDashboard";
// import AllCarehomes from "../pages/AllCarehomes";
// import AllNgos from "../pages/AllNgos";
// import AllEvents from "../pages/AllEvents";
// import AllFundraisers from "../pages/AllFundraisers";
// import DonateFundraiser from "../pages/DonateFundraiser";
// import ProtectedRoute from "./ProtectedRoute";
// import DonorRegistration from "../pages/DonorRegistration";
// import ViewCare from "../pages/ViewCare";

// const AppRoutes = () => {
//   return (
//     <Routes>
//       {/* Public Routes */}
//       <Route path="/" element={<LandingPage />} />
//       <Route path="/discover" element={<DiscoverPage />} />
//       <Route path="/login" element={<LoginPage />} />
//       <Route path="/signup" element={<Signup />} />
//       <Route path="/ways-to-help" element={<WaysToHelpPage />} />
//       <Route path="/donate-items" element={<DonateItemsPage />} />
//       <Route path="/donate-funds" element={<DonateMoneyPage />} />
//       <Route path="/jobs" element={<ListJobPage />} />

//       <Route path="/carehomes" element={<AllCarehomes />} />
//       <Route path="/all-ngos" element={<AllNgos />} />
//       <Route path="/events" element={<AllEvents />} />
//       <Route path="/fundraisers" element={<AllFundraisers />} />
//       <Route path="/donate_fundraiser/:ngoId/:name_fund" element={<DonateFundraiser />} />
//       <Route
//         path="/register-event/:ngoId/:eventName"
//         element={<DonorRegistration />}
//       />
//       <Route path="/carehomes/viewcare/:carehomeId" element={<ViewCare />} />

//       <Route path="/NGO-dashboard/:ngoID" element={<NGODashboard />} />

//       <Route
//         path="/NGO-dashboard/:ngoID/create-fundraiser"
//         element={<CreateFundraiser />}
//       />

//       <Route
//         path="/NGO-dashboard/:ngoID/create-event"
//         element={<CreateEvent />}
//       />

//       {/* Protected Routes */}
//       <Route
//         path="/donor-dashboard/:id"
//         element={
//           <ProtectedRoute allowedRoles={["Donor"]}>
//             <DonorDashboard />
//           </ProtectedRoute>
//         }
//       />
//       <Route
//         path="/carehome-dashboard/:careid"
//         element={<CarehomeDashboard />}
//       />
//       <Route
//   path="/carehome-dashboard/:careid/edit"
//   element={<EditProfile />}
// />

//       <Route path="/carehome-dashboard/get-job" element={<CreateJob />} />

//       {/*
//       <Route
//         path="/admin-dashboard"
//         element={
//           <ProtectedRoute allowedRoles={["admin"]}>
//             <AdminDashboard />
//           </ProtectedRoute>
//         }
//       />*/}

//       {/* Fallback route */}
//       {/* <Route path="*" element={<LandingPage />} /> */}
//     </Routes>
//   );
// };

// export default AppRoutes;








import { Routes, Route } from "react-router-dom";
import LandingPage from "../pages/Landingpage";
import DiscoverPage from "../pages/Discoverpage";
import LoginPage from "../pages/Loginpage";
import Signup from "../pages/Signuppage";
import DonorDashboard from "../dashboards/userDashboard";
import NGODashboard from "../pages/NGODashboard";
import CreateFundraiser from "../pages/CreateFundraiser";
import CreateEvent from "../pages/CreateEvent";
import WaysToHelpPage from "../pages/WaysToHelpPage";
import DonateItemsPage from "../pages/DonateItemsPage";
import DonateMoneyPage from "../pages/DonateMoneyPage";
import ListJobPage from "../pages/ListJobPage";
import CarehomeDashboard from "../pages/CarehomeDashboard";
import EditProfile from "../pages/EditProfileCarehome";
import CreateJob from "../pages/createJob";
// import OrphanageDashboard from "../pages/OrphanageDashboard";
// import AdminDashboard from "../pages/AdminDashboard";
import AllCarehomes from "../pages/AllCarehomes";
import AllNgos from "../pages/AllNgos";
import AllEvents from "../pages/AllEvents";
import AllFundraisers from "../pages/AllFundraisers";
import DonateFundraiser from "../pages/DonateFundraiser";
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
      <Route path="/ways-to-help" element={<WaysToHelpPage />} />
      <Route path="/donate-items" element={<DonateItemsPage />} />
      <Route path="/donate-funds" element={<DonateMoneyPage />} />
      <Route path="/jobs" element={<ListJobPage />} />

      <Route path="/carehomes" element={<AllCarehomes />} />
      <Route path="/all-ngos" element={<AllNgos />} />
      <Route path="/events" element={<AllEvents />} />
      <Route path="/fundraisers" element={<AllFundraisers />} />
      <Route path="/donate_fundraiser/:ngoId/:name_fund" element={<DonateFundraiser />} />
      <Route
        path="/register-event/:ngoId/:eventName"
        element={<DonorRegistration />}
      />
      <Route path="/carehomes/viewcare/:carehomeId" element={<ViewCare />} />

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
      <Route
  path="/carehome-dashboard/:careid"
  element={
    <ProtectedRoute allowedRoles={["Carehome"]}>
      <CarehomeDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/carehome-dashboard/:careid/edit"
  element={
    <ProtectedRoute allowedRoles={["Carehome"]}>
      <EditProfile />
    </ProtectedRoute>
  }
/>

<Route
  path="/carehome-dashboard/get-job"
  element={
    <ProtectedRoute allowedRoles={["Carehome"]}>
      <CreateJob />
    </ProtectedRoute>
  }
/>


      <Route path="/carehome-dashboard/get-job" element={<CreateJob />} />

      {/*
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
