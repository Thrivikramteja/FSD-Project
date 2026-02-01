import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLandingData } from "../store/entitiesSlice";
import { useNavigate } from "react-router-dom";

import Header from "../components/header";
import Footer from "../components/footer";
import Carousel from "../components/carousel";
import FAQ from "../components/faq";
import DonationTicker from '../pages/DonationTicker';

import '../styles/landing_page.css'
import { headerConfig } from "../config/headerConfig";

export default function LandingPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [tickerData, setTickerData] = useState([]);
  const [error, setError] = useState(null);

  const ngos = useSelector((state) => state.entities.ngos);
  const events = useSelector((state) => state.entities.events);

  useEffect(() => {
    // Existing Redux dispatch
    dispatch(fetchLandingData());

    // Ticker fetch
    const fetchTicker = async () => {
      try {
        const response = await fetch("http://localhost:3000/ticker-data");

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
        <section className="preview-section">
          <h2
            className="clickable-heading"
            onClick={() => navigate("/discover")}
          >
            NGOs
          </h2>

          <div className="preview-list">
            {ngos.slice(0, 4).map((ngo) => (
              <div key={ngo._id} className="preview-card">
                <h4>{ngo.name}</h4>
                <p>{ngo.location}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="preview-section">
          <h2
            className="clickable-heading"
            onClick={() => navigate("/discover")}
          >
            Carehomes
          </h2>

          <div className="preview-list">
            {events.slice(0, 4).map((ev) => (
              <div key={ev._id} className="preview-card">
                <h4>{ev.event_name}</h4>
                <p>{new Date(ev.event_date).toDateString()}</p>
              </div>
            ))}
          </div>
        </section>

        <DonationTicker donations={tickerData} />

        <FAQ />
      </main>

      <Footer />
    </div>
  );
}
