// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';

// // Components
// import Header from '../components/header';
// import Footer from '../components/footer';

// // Styles
// import '../styles/carehome.css';

// const AllCarehomes = () => {
//   const [carehomes, setCarehomes] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const navItems = [
//     { label: "Home", path: "/" },
//     { label: "Discover", path: "/discover" },
//     { label: "Login", path: "/login" },
//     { label: "Sign Up", path: "/signup" }
//   ];

//   // const navItems = [
//   //   { label: "Home", path: "/" },
//   //   {
//   //     label: "Discover",
//   //     children: [
//   //       { label: "NGOs", path: "/all-ngos" },
//   //       { label: "Care Homes", path: "/carehomes" },
//   //       { label: "Events", path: "/events" },
//   //       { label: "Fundraisers", path: "/fundraisers" }
//   //     ]
//   //   },
//   //   { label: "Login", path: "/login" },
//   //   { label: "Sign Up", path: "/signup" }
//   // ];

//   useEffect(() => {
//     const fetchCareHomes = async () => {
//       try {
//         const response = await fetch("http://localhost:3000/carehomes");
//         if (!response.ok) throw new Error("Failed to fetch care homes.");
//         const data = await response.json();

//         // Debugging: Check the browser console to see exactly what path the DB is sending!
//         console.log("First Carehome Image Path:", data[0]?.imagePath);

//         setCarehomes(data);
//         setLoading(false);
//       } catch (err) {
//         console.error("Error fetching carehomes:", err);
//         setError(err.message);
//         setLoading(false);
//       }
//     };
//     fetchCareHomes();
//   }, []);

//   // 👇 HELPER FUNCTION TO FIX IMAGE URLs
// //   const getImageUrl = (path) => {
// //     if (!path) return '/assets/default-carehome.jpg';

// //     // 1. Replace Windows Backslashes (\) with Forward Slashes (/)
// //     const cleanPath = path.replace(/\\/g, "/");

// //     // 2. Add the Backend URL
// //     return `http://localhost:3000/${cleanPath}`;
// //   };

// // 👇 IMPROVED HELPER FUNCTION
//   const getImageUrl = (path) => {
//     if (!path) return '/assets/default-carehome.jpg';

//     // 1. Normalize slashes
//     let cleanPath = path.replace(/\\/g, "/");

//     // 2. Remove 'public/' prefix if it exists in DB path
//     if (cleanPath.startsWith("public/")) {
//       cleanPath = cleanPath.substring(7); // Removes first 7 chars
//     }

//     // 3. Ensure no leading slash to avoid double slash
//     if (cleanPath.startsWith("/")) {
//       cleanPath = cleanPath.substring(1);
//     }

//     return `http://localhost:3000/${cleanPath}`;
//   };

//   return (
//     <div className="carehome-wrapper">
//       {/* <Header navItems={navItems} /> */}
//       <Header />

//       <main className="carehomes-content" style={{ minHeight: '80vh', paddingBottom: '2rem' }}>
//         <h1 style={{ textAlign: 'center', fontSize: '1.75rem', marginTop: '20px', marginBottom: '20px' }}>
//           List of Care Homes Associated with CareConnect
//         </h1>

//         {loading && <p style={{ textAlign: 'center' }}>Loading care homes...</p>}
//         {error && <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>}
//         {!loading && !error && carehomes.length === 0 && <p style={{ textAlign: 'center' }}>No care homes found.</p>}

//         {!loading && !error && carehomes.length > 0 && (
//           <div className="carehome-container">
//             {carehomes.map((carehome) => (
//               <div className="carehome-card" key={carehome.carehomeId || carehome._id}>

//                 <div className="carehome-content">
//                   {/* 👇 USE THE HELPER FUNCTION HERE */}
//                   <img
//                     src={getImageUrl(carehome.imagePath)}
//                     alt={carehome.care_home_name}
//                     onError={(e) => {
//                       console.log("Failed to load:", e.target.src); // Use Console to see why it failed
//                       e.target.src = 'https://via.placeholder.com/400x250?text=Image+Not+Found';
//                     }}
//                   />

//                   <h2>{carehome.care_home_name}</h2>

//                   <div className="carehome-location">
//                     <span>{carehome.city}</span> | <span>{carehome.state}</span>
//                   </div>

//                   <p>
//                     {carehome.description
//                       ? (carehome.description.length > 100 ? carehome.description.substring(0, 100) + "..." : carehome.description)
//                       : "No description available."}
//                   </p>

//                   <div className="carehome-buttons">
//                     <Link
//                       to={`/carehomes/viewcare/${carehome.carehomeId}`}
//                       className="carehome-details-btn"
//                     >
//                       View Details
//                     </Link>

//                     <Link
//                       to={`/donate_money?carehome_id=${carehome.carehomeId}`}
//                       className="carehome-donate-btn"
//                     >
//                       Donate
//                     </Link>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </main>

//       <Footer />
//     </div>
//   );
// };

// export default AllCarehomes;

// updated code below

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Components
import Header from "../components/header";
import Footer from "../components/footer";
// IMPORT the central config to provide the navItems array for the header
import { headerConfig } from "../config/headerConfig";

// Styles
import "../styles/carehome.css";

const AllCarehomes = () => {
  const [carehomes, setCarehomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCareHomes = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/carehomes");
        if (!response.ok) throw new Error("Failed to fetch care homes.");
        const data = await response.json();

        // Logs the path stored in your DB for troubleshooting
        console.log("Database Image Path Example:", data[0]?.imagePath);

        setCarehomes(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching carehomes:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchCareHomes();
  }, []);

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/400x250?text=No+Image";

    if (path.startsWith("http")) return path;

    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `http://localhost:3000${cleanPath}`;
  };

  return (
    <div className="carehome-wrapper">
      
      <Header navItems={headerConfig.landing} />

      <main
        className="carehomes-content"
        style={{ minHeight: "80vh", paddingBottom: "2rem" }}
      >
        <h1
          style={{
            textAlign: "center",
            fontSize: "1.75rem",
            marginTop: "20px",
            marginBottom: "20px",
          }}
        >
          List of Care Homes Associated with CareConnect
        </h1>

        {loading && (
          <p style={{ textAlign: "center" }}>Loading care homes...</p>
        )}
        {error && (
          <p style={{ textAlign: "center", color: "red" }}>Error: {error}</p>
        )}
        {!loading && !error && carehomes.length === 0 && (
          <p style={{ textAlign: "center" }}>No care homes found.</p>
        )}

        {!loading && !error && carehomes.length > 0 && (
          <div className="carehome-container">
            {carehomes.map((carehome) => (
              <div
                className="carehome-card"
                key={carehome.carehomeId || carehome._id}
              >
                <div className="carehome-content">
                  <img
                    src={getImageUrl(carehome.imagePath)}
                    alt={carehome.care_home_name}
                    className="carehome-image"
                    onError={(e) => {
                      console.log("Failed to load image from:", e.target.src);
                      e.target.src =
                        "https://via.placeholder.com/400x250?text=No+Image+Found";
                    }}
                  />

                  <h2>{carehome.care_home_name}</h2>

                  <div className="carehome-location">
                    <span>{carehome.city}</span> | <span>{carehome.state}</span>
                  </div>

                  <p>
                    {carehome.description
                      ? carehome.description.length > 100
                        ? carehome.description.substring(0, 100) + "..."
                        : carehome.description
                      : "No description available."}
                  </p>

                  <div className="carehome-buttons">
                    <Link
                      to={`/carehomes/viewcare/${carehome.carehomeId}`}
                      className="carehome-details-btn"
                    >
                      View Details
                    </Link>

                    <Link
                      to={`/donate-funds?carehome_id=${carehome.carehomeId}`}
                      className="carehome-donate-btn"
                    >
                      Donate
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AllCarehomes;
