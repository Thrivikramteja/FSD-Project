import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/header';
import Footer from '../components/footer';
import '../styles/view_care.css'; 

const ViewCare = () => {
  const { carehomeId } = useParams(); // Get ID from URL
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Discover", path: "/discover" },
    { label: "Login", path: "/login" },
    { label: "Sign Up", path: "/signup" }
  ];

useEffect(() => {
  const fetchCareDetails = async () => {
    try {
      // FIX: Added /api/ to the path to match standard backend routing
      // In ViewCare.jsx
      const response = await fetch(`http://localhost:3000/api/carehomes/viewcare/${carehomeId}`);
      
      if (!response.ok) {
        throw new Error("Care home not found");
      }

      const data = await response.json();
      setDetails(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (carehomeId) fetchCareDetails(); // Only fetch if ID exists
}, [carehomeId]);

const getImageUrl = (path) => {
  if (!path || path === "undefined") return '/assets/default-carehome.jpg';

  // 1. Normalize slashes for Windows
  let cleanPath = path.replace(/\\/g, "/");

  // 2. If the path in DB is "public/uploads/image.jpg", 
  // we want it to become "uploads/image.jpg"
  if (cleanPath.startsWith("public/")) {
    cleanPath = cleanPath.replace("public/", "");
  }

  // 3. Ensure it starts with a single slash for the URL
  if (!cleanPath.startsWith("/")) {
    cleanPath = "/" + cleanPath;
  }

  return `http://localhost:3000${cleanPath}`;
};
  // Safe Calculation for Average Expense
  const calculateAvg = () => {
    if (!details || !details.num_residents || details.num_residents === 0) return "N/A";
    return (details.avg_expense / details.num_residents).toFixed(2);
  };

  if (loading) return <div style={{textAlign:'center', marginTop:'50px'}}>Loading Details...</div>;
  if (error) return <div style={{textAlign:'center', marginTop:'50px', color:'red'}}>Error: {error}</div>;
  if (!details) return null;

  return (
    <div>
      <Header navItems={navItems} />

      <div className="view-care-wrapper">
        
        <h2 className="view-care-title">{details.care_home_name}</h2>
        <hr className="view-care-divider" />

        {/* Care Home Image */}
        <div className="view-care-image-container">
           <img 
             src={getImageUrl(details.imagePath)} 
             alt={details.care_home_name} 
             onError={(e) => { 
               e.target.onerror = null; 
               e.target.src = 'https://via.placeholder.com/800x400?text=No+Image+Available'; 
             }}
           />
        </div>

        <div className="view-care-description">
            <h3>Description:</h3>
            <p>{details.description || "No description provided."}</p>
        </div>

        <div className="view-care-stat-content">
            <div className="view-care-stats-card">
                <h3>Stats</h3>
                <ul>
                    <li>
                        <span className="view-care-label">Residents:</span>
                        <span className="view-care-value">{details.num_residents}</span>
                    </li>
                    <li>
                        <span className="view-care-label">Monthly Expense:</span>
                        <span className="view-care-value">₹{details.avg_expense}</span>
                    </li>
                    <li>
                        <span className="view-care-label">Avg Resident Expense:</span>
                        <span className="view-care-value">₹{calculateAvg()}</span>
                    </li>
                    
                    {/* Add Location if available */}
                    {details.city && (
                    <li>
                        <span className="view-care-label">Location:</span>
                        <span className="view-care-value">{details.city}, {details.state}</span>
                    </li>
                    )}
                </ul>
            </div>
        </div>

      </div>

      <Footer />
    </div>
  );
};

export default ViewCare;