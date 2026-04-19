import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header';
import Footer from '../components/footer';
import { AuthContext } from '../components/authContext';
import { headerConfig } from "../config/headerConfig"; 
import '../styles/fundraisers.css'; 

const AllFundraisers = () => {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  
  const [fundraisers, setFundraisers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [showFilter, setShowFilter] = useState(false);

  const tags = ["Health", "Education", "General", "Emergency", "Environment", "Animal Welfare", "Others"];

  // Fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (searchTerm) queryParams.append("q", searchTerm);
        if (selectedTags.length > 0) queryParams.append("tags", selectedTags.join(","));

        const response = await fetch(`http://localhost:3000/fundraisers?${queryParams.toString()}`);
        if (!response.ok) throw new Error("Fetch failed");

        const data = await response.json();
        setFundraisers(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    const delay = setTimeout(fetchData, 400); // Debounce
    return () => clearTimeout(delay);
  }, [searchTerm, selectedTags]);

  const handleTagChange = (e) => {
    const value = e.target.value;
    if (e.target.checked) {
      setSelectedTags([...selectedTags, value]);
    } else {
      setSelectedTags(selectedTags.filter(tag => tag !== value));
    }
  };

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/400x250?text=No+Image";
    return path.startsWith("http") ? path : `http://localhost:3000${path.startsWith("/") ? path : `/${path}`}`;
  };

  const handleDonateClick = (fund) => {
    if (!auth.user || auth.role !== 'Donor') {
      alert("Donor login required");
      return;
    }
    navigate(`/donate_fundraiser/${fund.ngoId}/${fund.fundraiser_name}`);
  };

  return (
    <div className="fund-wrapper">
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
                    type="checkbox" value={tag} 
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
          type="text" className="fund-search-input"
          placeholder="Search (Optimized)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && <p style={{ textAlign: 'center' }}>Searching...</p>}
      {error && <p style={{ textAlign: 'center', color: 'red' }}>{error}</p>}
      
      {!loading && fundraisers.length === 0 && (
         <p style={{ textAlign: 'center', marginTop: '20px' }}>No matches.</p>
      )}

      <div className="fund-container">
        {!loading && fundraisers.map((fund) => (
          <div className="fund-card" key={fund._id}>
            <img 
              src={getImageUrl(fund.imagePath)} alt={fund.fundraiser_name}
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
              <button onClick={() => handleDonateClick(fund)} className="fund-donate-btn">Donate</button>
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
};

export default AllFundraisers;