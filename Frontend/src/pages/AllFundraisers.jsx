// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';

// import Header from '../components/header';
// import Footer from '../components/footer';
// import '../styles/fundraisers.css'; 

// const AllFundraisers = () => {
//   const [fundraisers, setFundraisers] = useState([]); // All data
//   const [filteredFundraisers, setFilteredFundraisers] = useState([]); // Displayed data
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Filter States
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedTags, setSelectedTags] = useState([]);
//   const [showFilter, setShowFilter] = useState(false);

//   const tags = ["Health", "Education", "General", "Emergency", "Environment", "Animal Welfare", "Others"];

//   const navItems = [
//     { label: "Home", path: "/" },
//     { label: "Discover", path: "/discover" },
//     { label: "Login", path: "/login" },
//     { label: "Sign Up", path: "/signup" }
//   ];

//   // 1. Fetch Data
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await fetch("http://localhost:3000/fundraisers");
//         if (!response.ok) throw new Error("Failed to fetch fundraisers");
//         const data = await response.json();
//         setFundraisers(data);
//         setFilteredFundraisers(data); // Initially show all
//         setLoading(false);
//       } catch (err) {
//         setError(err.message);
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   // 2. Filter Logic (Runs whenever search or tags change)
//   useEffect(() => {
//     let result = fundraisers;

//     // Filter by Search
//     if (searchTerm) {
//       result = result.filter(item => 
//         item.fundraiser_name.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//     }

//     // Filter by Tags
//     if (selectedTags.length > 0) {
//       result = result.filter(item => 
//         // Case insensitive comparison
//         selectedTags.some(tag => item.tag && item.tag.toLowerCase() === tag.toLowerCase())
//       );
//     }

//     setFilteredFundraisers(result);
//   }, [searchTerm, selectedTags, fundraisers]);

//   // Handle Checkbox Change
//   const handleTagChange = (e) => {
//     const value = e.target.value;
//     if (e.target.checked) {
//       setSelectedTags([...selectedTags, value]);
//     } else {
//       setSelectedTags(selectedTags.filter(tag => tag !== value));
//     }
//   };

//   // Helper for Image URL (Windows path fix)
//   const getImageUrl = (path) => {
//     if (!path) return '/assets/default-fundraiser.jpg';
//     return `http://localhost:3000/${path.replace(/\\/g, "/")}`;
//   };

//   return (
//     <div className="fund-wrapper">
//       <Header navItems={navItems} />

//       {/* --- Search & Filter Bar --- */}
//       <div className="fund-search-container">
        
//         {/* Filter Dropdown */}
//         <div className="fund-filter-section">
//           <button className="fund-filter-btn" onClick={() => setShowFilter(!showFilter)}>
//             Filters {selectedTags.length > 0 ? `(${selectedTags.length})` : ''}
//           </button>
          
//           {showFilter && (
//             <div className="fund-filter-dropdown">
//               <h3>Filter by Tag</h3>
//               {tags.map(tag => (
//                 <label key={tag} className="fund-checkbox-label">
//                   <input 
//                     type="checkbox" 
//                     value={tag} 
//                     onChange={handleTagChange}
//                     checked={selectedTags.includes(tag)}
//                   />
//                   <span>{tag}</span>
//                 </label>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Search Input */}
//         <input 
//           type="text" 
//           className="fund-search-input"
//           placeholder="Search fundraisers..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//       </div>

//       {/* --- Content Area --- */}
//       {loading && <p style={{ textAlign: 'center' }}>Loading fundraisers...</p>}
//       {error && <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>}
      
//       {!loading && !error && filteredFundraisers.length === 0 && (
//          <p style={{ textAlign: 'center', marginTop: '20px' }}>No fundraisers match your search.</p>
//       )}

//       {/* Grid */}
//       <div className="fund-container">
//         {!loading && !error && filteredFundraisers.map((fund) => (
//           <div className="fund-card" key={fund._id || fund.id}>
            
//             {/* Image */}
//             <img 
//               src={getImageUrl(fund.imagePath)} 
//               alt={fund.fundraiser_name}
//               onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=No+Image'; }}
//             />

//             {/* Details */}
//             <h3>{fund.fundraiser_name}</h3>
//             <p className="fund-tag">Tag: {fund.tag || "General"}</p>

//             <div className="fund-info">
//               <div>
//                 <h4>₹{(fund.amount_raised_so_far || 0).toLocaleString()}</h4>
//                 <p>Raised</p>
//               </div>
//               <div>
//                 <h4>₹{(fund.goal_amount || 0).toLocaleString()}</h4>
//                 <p>Goal</p>
//               </div>
//             </div>

//             {/* Button */}
//             <div style={{ marginTop: '15px' }}>
//               <Link 
//                 to={`/donate_fundraiser/${fund.ngoId}/${fund.fundraiser_name}`}
//                 className="fund-donate-btn"
//               >
//                 Donate
//               </Link>
//             </div>

//           </div>
//         ))}
//       </div>

//       <Footer />
//     </div>
//   );
// };

// export default AllFundraisers; 



import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Header from '../components/header';
import Footer from '../components/footer';
import { AuthContext } from '../components/authContext';
// IMPORT the central config
import { headerConfig } from "../config/headerConfig"; 

import '../styles/fundraisers.css'; 

const AllFundraisers = () => {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  
  const [fundraisers, setFundraisers] = useState([]); 
  const [filteredFundraisers, setFilteredFundraisers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [showFilter, setShowFilter] = useState(false);

  const tags = ["Health", "Education", "General", "Emergency", "Environment", "Animal Welfare", "Others"];

  // REMOVED: local navItems array to ensure dropdown functionality works

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3000/fundraisers");
        if (!response.ok) throw new Error("Failed to fetch fundraisers");
        const data = await response.json();
        setFundraisers(data);
        setFilteredFundraisers(data); 
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let result = fundraisers;
    if (searchTerm) {
      result = result.filter(item => 
        item.fundraiser_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedTags.length > 0) {
      result = result.filter(item => 
        selectedTags.some(tag => item.tag && item.tag.toLowerCase() === tag.toLowerCase())
      );
    }
    setFilteredFundraisers(result);
  }, [searchTerm, selectedTags, fundraisers]);

  const handleTagChange = (e) => {
    const value = e.target.value;
    if (e.target.checked) {
      setSelectedTags([...selectedTags, value]);
    } else {
      setSelectedTags(selectedTags.filter(tag => tag !== value));
    }
  };

  const getImageUrl = (path) => {
    if (!path) return '/assets/default-fundraiser.jpg';
    return `http://localhost:3000/${path.replace(/\\/g, "/")}`;
  };

  const handleDonateClick = (fund) => {
    
    if (!auth.user) {
      alert("Please login first to donate");
      return;
    }

    
    if (auth.role !== 'Donor') {
      alert("Please login as a donor or create a donor account to donate");
      return;
    }

    // Redirect to donate page
    navigate(`/donate_fundraiser/${fund.ngoId}/${fund.fundraiser_name}`);
  };

  return (
    <div className="fund-wrapper">
      {/* PASS the global config here */}
      <Header navItems={headerConfig.landing} />

      <div className="fund-search-container">
        <div className="fund-filter-section">
          <button className="fund-filter-btn" onClick={() => setShowFilter(!showFilter)}>
            Filters {selectedTags.length > 0 ? `(${selectedTags.length})` : ''}
          </button>
          
          {showFilter && (
            <div className="fund-filter-dropdown">
              <h3>Filter by Tag</h3>
              {tags.map(tag => (
                <label key={tag} className="fund-checkbox-label">
                  <input 
                    type="checkbox" 
                    value={tag} 
                    onChange={handleTagChange}
                    checked={selectedTags.includes(tag)}
                  />
                  <span>{tag}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <input 
          type="text" 
          className="fund-search-input"
          placeholder="Search fundraisers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && <p style={{ textAlign: 'center' }}>Loading fundraisers...</p>}
      {error && <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>}
      
      {!loading && !error && filteredFundraisers.length === 0 && (
         <p style={{ textAlign: 'center', marginTop: '20px' }}>No fundraisers match your search.</p>
      )}

      <div className="fund-container">
        {!loading && !error && filteredFundraisers.map((fund) => (
          <div className="fund-card" key={fund._id || fund.id}>
            <img 
              src={getImageUrl(fund.imagePath)} 
              alt={fund.fundraiser_name}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=No+Image'; }}
            />

            <h3>{fund.fundraiser_name}</h3>
            <p className="fund-tag">Tag: {fund.tag || "General"}</p>

            <div className="fund-info">
              <div>
                <h4>₹{(fund.amount_raised_so_far || 0).toLocaleString()}</h4>
                <p>Raised</p>
              </div>
              <div>
                <h4>₹{(fund.goal_amount || 0).toLocaleString()}</h4>
                <p>Goal</p>
              </div>
            </div>

            <div style={{ marginTop: '15px' }}>
              <button 
                type="button"
                onClick={() => handleDonateClick(fund)}
                className="fund-donate-btn"
              >
                Donate
              </button>
            </div>
          </div>
        ))}
      </div>

      <Footer />
    </div>
  );
};

export default AllFundraisers;