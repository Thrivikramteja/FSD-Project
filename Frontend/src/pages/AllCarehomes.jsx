// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';

// // Importing Components
// import Header from '../components/header'; 
// import Footer from '../components/footer';

// // Importing Styles (Normal import, NOT module)
// import '../styles/carehome.css'; 
// // import '../styles/landing_page.css'; // You can keep this if needed for header/footer

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

//   useEffect(() => {
//     const fetchCareHomes = async () => {
//       try {
//         const response = await fetch("http://localhost:3000/carehomes");
//         if (!response.ok) throw new Error("Failed to fetch care homes.");
//         const data = await response.json();
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

//   return (
//     // Applied .carehome-wrapper to simulate the 'body' style
//     <div className="carehome-wrapper">
//       <Header navItems={navItems} />

//       <main className="carehomes-content" style={{ minHeight: '80vh', paddingBottom: '2rem' }}>
//         <h1 style={{ textAlign: 'center', fontSize: '1.75rem', marginTop: '20px', marginBottom: '20px' }}>
//           List of Care Homes Associated with CareConnect
//         </h1>

//         {loading && <p style={{ textAlign: 'center' }}>Loading care homes...</p>}
//         {error && <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>}
//         {!loading && !error && carehomes.length === 0 && <p style={{ textAlign: 'center' }}>No care homes found.</p>}

//         {!loading && !error && carehomes.length > 0 && (
//           // Updated: .carehome-container
//           <div className="carehome-container">
//             {carehomes.map((carehome) => (
//               // Updated: .carehome-card
//               <div className="carehome-card" key={carehome.carehomeId || carehome._id}>
                
//                 {/* Updated: .carehome-content */}
//                 <div className="carehome-content">
//                   <img 
//                     src={carehome.imagePath ? `http://localhost:3000/${carehome.imagePath}` : '/assets/default-carehome.jpg'}
//                     alt={carehome.care_home_name}
//                     // Inline styles removed because CSS handles it now
//                     onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=No+Image'; }}
//                   />
                  
//                   <h2>{carehome.care_home_name}</h2>
                  
//                   {/* Updated: .carehome-location */}
//                   <div className="carehome-location">
//                     <span>{carehome.city}</span> | <span>{carehome.state}</span>
//                   </div>
                  
//                   <p>
//                     {carehome.description 
//                       ? (carehome.description.length > 100 ? carehome.description.substring(0, 100) + "..." : carehome.description)
//                       : "No description available."}
//                   </p>
                  
//                   {/* Updated: .carehome-buttons */}
//                   <div className="carehome-buttons">
//                     <Link 
//                       to={`/carehomes/viewcare/${carehome.carehomeId}`} 
//                       className="carehome-details-btn" // Updated Class
//                     >
//                       View Details
//                     </Link>
                    
//                     <Link 
//                       to={`/donate_money?carehome_id=${carehome.carehomeId}`} 
//                       className="carehome-donate-btn" // Updated Class
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


import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Components
import Header from '../components/header'; 
import Footer from '../components/footer';

// Styles
import '../styles/carehome.css'; 

const AllCarehomes = () => {
  const [carehomes, setCarehomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Discover", path: "/discover" },
    { label: "Login", path: "/login" },
    { label: "Sign Up", path: "/signup" }
  ];

  useEffect(() => {
    const fetchCareHomes = async () => {
      try {
        const response = await fetch("http://localhost:3000/carehomes");
        if (!response.ok) throw new Error("Failed to fetch care homes.");
        const data = await response.json();
        
        // Debugging: Check the browser console to see exactly what path the DB is sending!
        console.log("First Carehome Image Path:", data[0]?.imagePath);
        
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

  // 👇 HELPER FUNCTION TO FIX IMAGE URLs
  const getImageUrl = (path) => {
    if (!path) return '/assets/default-carehome.jpg';

    // 1. Replace Windows Backslashes (\) with Forward Slashes (/)
    const cleanPath = path.replace(/\\/g, "/");

    // 2. Add the Backend URL
    return `http://localhost:3000/${cleanPath}`;
  };

  return (
    <div className="carehome-wrapper">
      <Header navItems={navItems} />

      <main className="carehomes-content" style={{ minHeight: '80vh', paddingBottom: '2rem' }}>
        <h1 style={{ textAlign: 'center', fontSize: '1.75rem', marginTop: '20px', marginBottom: '20px' }}>
          List of Care Homes Associated with CareConnect
        </h1>

        {loading && <p style={{ textAlign: 'center' }}>Loading care homes...</p>}
        {error && <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>}
        {!loading && !error && carehomes.length === 0 && <p style={{ textAlign: 'center' }}>No care homes found.</p>}

        {!loading && !error && carehomes.length > 0 && (
          <div className="carehome-container">
            {carehomes.map((carehome) => (
              <div className="carehome-card" key={carehome.carehomeId || carehome._id}>
                
                <div className="carehome-content">
                  {/* 👇 USE THE HELPER FUNCTION HERE */}
                  <img 
                    src={getImageUrl(carehome.imagePath)} 
                    alt={carehome.care_home_name}
                    onError={(e) => { 
                      console.log("Failed to load:", e.target.src); // Use Console to see why it failed
                      e.target.src = 'https://via.placeholder.com/400x250?text=Image+Not+Found'; 
                    }}
                  />
                  
                  <h2>{carehome.care_home_name}</h2>
                  
                  <div className="carehome-location">
                    <span>{carehome.city}</span> | <span>{carehome.state}</span>
                  </div>
                  
                  <p>
                    {carehome.description 
                      ? (carehome.description.length > 100 ? carehome.description.substring(0, 100) + "..." : carehome.description)
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
                      to={`/donate_money?carehome_id=${carehome.carehomeId}`} 
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