import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header';
import Footer from '../components/footer';
import { headerConfig } from "../config/headerConfig"; 
import '../styles/allngos.css'; 

const AllNgos = () => {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // Search State
  const navigate = useNavigate(); 

  useEffect(() => {
    const fetchNgos = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({ page: 1 });
        if (searchTerm) queryParams.append("q", searchTerm);

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ngos?${queryParams.toString()}`);
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        
        const result = await response.json();
        setNgos(result.data || []); 
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(fetchNgos, 400); // Debounce
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  return (
    <div className="ngo-wrapper">
      <Header navItems={headerConfig.landing} />
      <main className="ngo-main-content">
        <h1 className="ngo-title">NGOs awarded Trusted Organization Certification</h1>
        
        {/* Search Bar */}
        <div className="ngo-search-container">
          <input 
            type="text"
            className="ngo-search-input"
            placeholder="Search by NGO name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading && <p>Updating results...</p>}
        {!loading && !error && ngos.length === 0 && <p>No NGOs found matching your search.</p>}

        {!loading && !error && ngos.length > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {ngos.map((ngo) => (
              <div className="ngo-card" key={ngo._id} onClick={() => navigate(`/ngo-profile/${ngo.ngoId}`)}>
                <div className="ngo-details">
                  <h2>{ngo.Ngoname}</h2>
                  <p><strong>Phone:</strong> {ngo.phone}</p>
                  <p><strong>Email:</strong> {ngo.email}</p>
                </div>
                <div className="ngo-revenue">
                  <p style={{ fontWeight: 'bold', color: '#888', textTransform: 'uppercase' }}>Insights</p>
                  <p><strong>Total Revenue</strong><span>Rs. {ngo.totalFundsRaised.toLocaleString()}</span></p>
                  <p><strong>Care Homes</strong><span>{ngo.careHomesBenefited}</span></p>
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