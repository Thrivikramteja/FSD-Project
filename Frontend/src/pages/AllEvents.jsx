import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import Header from "../components/header";
import Footer from "../components/footer";
import { headerConfig } from "../config/headerConfig";

import styles from "../styles/events.module.css"; // Use Module

const AllEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/events");
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || "Failed to fetch events");
        }
        const data = await response.json();
        setEvents(data);
        setLoading(false);
      } catch (err) {
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
    <div className={styles.eventWrapper}>
      <Header navItems={headerConfig.landing} />

      <div className={styles.heroSection}>
        <h1 className={styles.mainTitle}>Upcoming Events</h1>
        <p className={styles.subTitle}>Join our community and make an impact in person.</p>
      </div>

      {loading && (
        <div className={styles.loaderContainer}>
          <div className={styles.spinner}></div>
          <p>Discovering events...</p>
        </div>
      )}

      {error && (
        <div className={styles.errorState}>
          <p>Oops! {error}</p>
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className={styles.emptyState}>
          <p>No upcoming events found at the moment.</p>
        </div>
      )}

      <div className={styles.eventContainer}>
        {!loading &&
          !error &&
          events.map((event) => (
            <div className={styles.eventCard} key={event._id || event.id}>
              <div className={styles.imageBox}>
                <img
                  src={getImageUrl(event.imagePath)}
                  alt={event.event_name}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/400x200?text=No+Image";
                  }}
                />
                <div className={styles.dateBadge}>
                  {new Date(event.event_date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>

              <div className={styles.cardContent}>
                <h3 className={styles.eventTitle}>{event.event_name}</h3>
                <p className={styles.locationText}>📍 {event.event_location || "Online"}</p>

                <div className={styles.eventInfo}>
                  <div className={styles.stat}>
                    <span className={styles.statNumber}>
                      {(event.number_of_registrations || 0).toLocaleString()}
                    </span>
                    <span className={styles.statLabel}>Supporters</span>
                  </div>
                </div>

                <div className={styles.eventButtons}>
                  <Link to={`/register-event/${event.ngoId}/${event.event_name}`} className={styles.linkFull}>
                    <button className={styles.eventSelectBtn}>Register Now</button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
      </div>

      <Footer />
    </div>
  );
};

export default AllEvents;