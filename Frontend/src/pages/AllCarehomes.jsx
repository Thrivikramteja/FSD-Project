import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import { headerConfig } from "../config/headerConfig";
import { apiFetch, apiUrl } from "../services/api";
import "../styles/carehome.css";

const AllCarehomes = () => {
  const [carehomes, setCarehomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // State

  useEffect(() => {
    const fetchCareHomes = async () => {
      setLoading(true);
      try {
        const url = searchTerm
          ? `/api/carehomes?q=${searchTerm}`
          : "/api/carehomes";

        const response = await apiFetch(url);
        if (!response.ok) throw new Error("Fetch failed");

        const data = await response.json();
        setCarehomes(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    const delay = setTimeout(fetchCareHomes, 400); // Debounce
    return () => clearTimeout(delay);
  }, [searchTerm]);

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/400x250?text=No+Image";
    return path.startsWith("http") ? path : apiUrl(path);
  };

  return (
    <div className="carehome-wrapper">
      <Header navItems={headerConfig.landing} />

      <main className="carehomes-content" style={{ minHeight: "80vh", paddingBottom: "2rem" }}>
        <h1 style={{ textAlign: "center", fontSize: "1.75rem", marginTop: "20px" }}>
          Care Homes Associated with CareConnect
        </h1>

        <div className="care-search-container">
          <input 
            type="text"
            className="care-search-input"
            placeholder="Search by name, city, or state..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading && <p style={{ textAlign: "center" }}>Searching...</p>}
        {!loading && !error && carehomes.length === 0 && (
          <p style={{ textAlign: "center" }}>No results found.</p>
        )}

        {!loading && !error && (
          <div className="carehome-container">
            {carehomes.map((carehome) => (
              <div className="carehome-card" key={carehome.carehomeId || carehome._id}>
                <div className="carehome-content">
                  <img 
                    src={getImageUrl(carehome.imagePath)} 
                    alt={carehome.care_home_name}
                    onError={(e) => { e.target.src = "https://via.placeholder.com/400x250?text=No+Image"; }}
                  />
                  <h2>{carehome.care_home_name}</h2>
                  <div className="carehome-location">
                    <span>{carehome.city}</span> | <span>{carehome.state}</span>
                  </div>
                  <p>{carehome.description?.substring(0, 100)}...</p>
                  <div className="carehome-buttons">
                    <Link to={`/carehomes/viewcare/${carehome.carehomeId}`} className="carehome-details-btn">View Details</Link>
                    <Link to={`/donate-funds?carehome_id=${carehome.carehomeId}`} className="carehome-donate-btn">Donate</Link>
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