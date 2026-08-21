import { apiFetch } from "../services/api";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLandingData } from "../store/entitiesSlice";
import { useNavigate } from "react-router-dom";

import Header from "../components/header";
import Footer from "../components/footer";
import Carousel from "../components/carousel";
import FAQ from "../components/faq";
import DonationTicker from "../pages/DonationTicker";

import "../styles/landing_page.css";
import { headerConfig } from "../config/headerConfig";

export default function LandingPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [tickerData, setTickerData] = useState([]);

  useEffect(() => {
    dispatch(fetchLandingData());

    const fetchTicker = async () => {
      try {
        const response = await apiFetch(`/ticker-data`);

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || "Failed to fetch ticker data");
        }

        const json = await response.json();

        if (json.success) {
          setTickerData(json.data);
        }
      } catch (err) {
        console.error("Ticker fetch failed:", err);

        setError(err.message || "Failed to load ticker");

        setTimeout(() => {
          window.location.href = "/error";
        }, 5000);
      }
    };

    fetchTicker();
  }, [dispatch]);

  return (
    <div>
      <Header navItems={headerConfig.landing} />

      <Carousel />

      <main>
        <section className="how-it-works-section">
          <div className="section-container">
            <div className="section-header">
              <h2 className="section-title">Making a Difference Together</h2>
              <p className="section-subtitle">
                A unified platform connecting those who can give with those in
                need.
              </p>
            </div>

            <div className="features-grid">
              {/* For Donors */}
              <div className="feature-card">
                <div className="icon-wrapper donor-icon">🤝</div>
                <h3>For Donors</h3>
                <p>
                  Easily browse verified NGOs and Carehomes. Donate food,
                  clothes, or funds directly to specific causes and track your
                  impact in real-time.
                </p>
                <button
                  className="feature-link"
                  onClick={() => navigate("/ways-to-help")}
                >
                  Start Giving →
                </button>
              </div>

              {/* For NGOs */}
              <div className="feature-card">
                <div className="icon-wrapper ngo-icon">🏢</div>
                <h3>For NGOs</h3>
                <p>
                  Manage your fundraisers and event management in one place.
                  Connect with a community of donors and streamline your
                  distribution process.
                </p>
                <button
                  className="feature-link"
                  onClick={() => navigate("/signup")}
                >
                  Partner with Us →
                </button>
              </div>

              {/* For Care Homes */}
              <div className="feature-card">
                <div className="icon-wrapper home-icon">🏠</div>
                <h3>For Care Homes</h3>
                <p>
                  Post essential requirements and job opportunities for
                  caregivers. Get the support your residents need from a network
                  of verified providers.
                </p>
                <button
                  className="feature-link"
                  onClick={() => navigate("/signup")}
                >
                  Join the Network →
                </button>
              </div>

              {/* NEW: For Corporates */}
              <div className="feature-card">
                <div className="icon-wrapper corporate-icon">💼</div> {/* You can use 🏢 or 👔 too */}
                <h3>For Corporates</h3>
                <p>
                  Drive social impact through CSR initiatives. Make high-value 
                  bulk donations to verified NGOs and receive official 80G tax 
                  certificates for your records.
                </p>
                <button
                  className="feature-link"
                  onClick={() => navigate("/all-ngos")} // Redirects to the list of NGOs
                >
                  View NGO Partners →
                </button>
              </div>
            </div>
          </div>
        </section>

        <DonationTicker donations={tickerData} />

        <FAQ />
      </main>

      <Footer />
    </div>
  );
}
