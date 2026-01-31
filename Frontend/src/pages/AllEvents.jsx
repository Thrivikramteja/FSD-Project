import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import Header from "../components/header";
import Footer from "../components/footer";
import { headerConfig } from "../config/headerConfig";

import "../styles/events.css";

const AllEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/events");
        console.log("sent req to events")

        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }

        const data = await response.json();
        console.log(data);
        setEvents(data);
        setLoading(false);
      } catch (err) {
        console.error("Error:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/400x250?text=No+Image";

    if (path.startsWith("http")) return path;

    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `http://localhost:3000${cleanPath}`;
  };

  return (
    <div className="event-wrapper">
      <Header navItems={headerConfig.landing} />

      <h1 style={{ textAlign: "center", marginTop: "30px", color: "#333" }}>
        Upcoming Events
      </h1>

      {loading && <p style={{ textAlign: "center" }}>Loading events...</p>}
      {error && (
        <p style={{ textAlign: "center", color: "red" }}>Error: {error}</p>
      )}
      {!loading && !error && events.length === 0 && (
        <p style={{ textAlign: "center" }}>No upcoming events found.</p>
      )}

      <div className="event-container">
        {!loading &&
          !error &&
          events.map((event) => (
            <div className="event-card" key={event._id || event.id}>
              <img
                src={getImageUrl(event.imagePath)}
                alt={event.event_name}
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/400x200?text=No+Image";
                }}
              />
              <h3>{event.event_name}</h3>

              <div className="event-info">
                <div>
                  <h4>
                    {(event.number_of_registrations || 0).toLocaleString()}
                  </h4>
                  <p>Supporters</p>
                </div>
              </div>

              <div className="event-buttons">
                <Link to={`/register-event/${event.ngoId}/${event.event_name}`}>
                  <button className="event-select-btn">Register</button>
                </Link>
              </div>
            </div>
          ))}
      </div>

      <Footer />
    </div>
  );
};

export default AllEvents;
