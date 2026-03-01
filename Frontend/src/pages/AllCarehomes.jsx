import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Components
import Header from "../components/header";
import Footer from "../components/footer";
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

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || "Failed to fetch care homes.");
        }

        const data = await response.json();

        console.log("Database Image Path Example:", data[0]?.imagePath);

        setCarehomes(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching carehomes:", err);

        setError(err.message || "Failed to load care homes.");
        setLoading(false);

        
        setTimeout(() => {
          window.location.href = "/error";
        }, 5000);
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
          <p style={{ textAlign: "center", color: "red" }}>
            Error: {error}
          </p>
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
                      e.target.src =
                        "https://via.placeholder.com/400x250?text=No+Image+Found";
                    }}
                  />

                  <h2>{carehome.care_home_name}</h2>

                  <div className="carehome-location">
                    <span>{carehome.city}</span> |{" "}
                    <span>{carehome.state}</span>
                  </div>

                  <p>
                    {carehome.description
                      ? carehome.description.length > 100
                        ? carehome.description.substring(0, 100) + "..."
                        : carehome.description
                      : "No description available."}
                  </p>

                  {/* <div className="carehome-buttons">
                    <Link
  to={`/carehomes/viewcare/${carehome._id}`}
  className="carehome-details-btn"
>
  View Details
</Link>

<Link
  to={`/donate-funds?carehome_id=${carehome._id}`}
  className="carehome-donate-btn"
>
  Donate
</Link> */}
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
