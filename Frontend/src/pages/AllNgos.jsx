// import React, { useState, useEffect } from 'react';
// import Header from '../components/header';
// import Footer from '../components/footer';

// // Importing your existing (now updated) CSS file
// import '../styles/allngos.css'; 

// const AllNgos = () => {
//   const [ngos, setNgos] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const navItems = [
//     { label: "Home", path: "/" },
//     { label: "Discover", path: "/discover" },
//     { label: "Login", path: "/login" },
//     { label: "Sign Up", path: "/signup" }
//   ];

//   useEffect(() => {
//     const fetchNgos = async () => {
//       try {
//         // Fetching from Backend (Port 3000)
//         const response = await fetch("http://localhost:3000/NGOs");

//         if (!response.ok) {
//           throw new Error(`HTTP error! Status: ${response.status}`);
//         }

//         const data = await response.json();
//         setNgos(data);
//         setLoading(false);
//       } catch (err) {
//         console.error("Failed to load NGOs:", err);
//         setError(err.message);
//         setLoading(false);
//       }
//     };

//     fetchNgos();
//   }, []);

//   return (
//     // Wrapper class matches CSS
//     <div className="ngo-wrapper">
//       <Header navItems={navItems} />

//       <main className="ngo-main-content">
//         <h1 className="ngo-title">NGOs awarded Trusted Organization Certification</h1>

//         {loading && <p style={{ textAlign: 'center' }}>Loading Organizations...</p>}
//         {error && <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>}
//         {!loading && !error && ngos.length === 0 && <p style={{ textAlign: 'center' }}>No NGOs found.</p>}

//         {!loading && !error && ngos.length > 0 && (
//           <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//             {ngos.map((ngo) => (
              
//               // 👇 UPDATED CLASS: .ngo-card
//               <div className="ngo-card" key={ngo._id || ngo.id}>
                
//                 {/* 👇 UPDATED CLASS: .ngo-details */}
//                 <div className="ngo-details">
//                   <h2>{ngo.Ngoname}</h2>
//                   <p><strong>Phone:</strong> {ngo.phone}</p>
//                   <p><strong>Email:</strong> {ngo.email}</p>
//                 </div>

//                 {/* 👇 UPDATED CLASS: .ngo-revenue */}
//                 <div className="ngo-revenue">
//                   <p style={{ fontWeight: 'bold', color: '#888', textTransform: 'uppercase' }}>FY YOE - 2025</p>
                  
//                   <p>
//                     <strong>Total Revenue</strong>
//                     <span>Rs. {ngo.totalFundsRaised}</span>
//                   </p>
//                   <p>
//                     <strong>Total Registrations</strong>
//                     <span>{ngo.totalRegistrations}</span>
//                   </p>
//                   <p>
//                     <strong>Fundraisers Created</strong>
//                     <span>{ngo.fundraisersCreated}</span>
//                   </p>
//                   <p>
//                     <strong>Care Homes Benefited</strong>
//                     <span>{ngo.careHomesBenefited}</span>
//                   </p>
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

// export default AllNgos;


// updated code is below


import React, { useState, useEffect } from 'react';
import Header from '../components/header';
import Footer from '../components/footer';
// Import the global configuration that contains your dropdown subItems
import { headerConfig } from "../config/headerConfig"; 

// Importing your existing CSS file
import '../styles/allngos.css'; 

const AllNgos = () => {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // NOTE: The local 'navItems' array was removed to ensure the Header 
  // receives the 'subItems' property from headerConfig.landing.

  useEffect(() => {
    const fetchNgos = async () => {
      try {
        // Fetching from Backend (Port 3000)
        const response = await fetch("http://localhost:3000/api/NGOs");

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setNgos(data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load NGOs:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchNgos();
  }, []);

  return (
    <div className="ngo-wrapper">
      {/* Updated to pass headerConfig.landing. 
          This ensures the 'Discover' item includes the 'subItems' array 
          needed for the dropdown to function.
      */}
      <Header navItems={headerConfig.landing} />

      <main className="ngo-main-content">
        <h1 className="ngo-title">NGOs awarded Trusted Organization Certification</h1>

        {loading && <p style={{ textAlign: 'center' }}>Loading Organizations...</p>}
        {error && <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>}
        {!loading && !error && ngos.length === 0 && <p style={{ textAlign: 'center' }}>No NGOs found.</p>}

        {!loading && !error && ngos.length > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {ngos.map((ngo) => (
              <div className="ngo-card" key={ngo._id || ngo.id}>
                
                <div className="ngo-details">
                  <h2>{ngo.Ngoname}</h2>
                  <p><strong>Phone:</strong> {ngo.phone}</p>
                  <p><strong>Email:</strong> {ngo.email}</p>
                </div>

                <div className="ngo-revenue">
                  <p style={{ fontWeight: 'bold', color: '#888', textTransform: 'uppercase' }}>FY YOE - 2025</p>
                  
                  <p>
                    <strong>Total Revenue</strong>
                    <span>Rs. {ngo.totalFundsRaised}</span>
                  </p>
                  <p>
                    <strong>Total Registrations</strong>
                    <span>{ngo.totalRegistrations}</span>
                  </p>
                  <p>
                    <strong>Fundraisers Created</strong>
                    <span>{ngo.fundraisersCreated}</span>
                  </p>
                  <p>
                    <strong>Care Homes Benefited</strong>
                    <span>{ngo.careHomesBenefited}</span>
                  </p>
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

export default AllNgos;