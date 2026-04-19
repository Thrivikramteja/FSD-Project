import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import { headerConfig } from "../config/headerConfig";
import styles from "../styles/events.module.css"; 

const AllEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // Search State

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({ page: 1 });
        if (searchTerm) queryParams.append("q", searchTerm);

        const response = await fetch(`http://localhost:3000/api/events?${queryParams.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch events");
        
        const result = await response.json();
        if (result.success) setEvents(result.data || []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(fetchEvents, 400); // Optimization
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/400x250?text=No+Image";
    return path.startsWith("http") ? path : `http://localhost:3000${path.startsWith("/") ? path : `/${path}`}`;
  };

  return (
    <div className={styles.eventWrapper}>
      <Header navItems={headerConfig.landing} />

      <div className={styles.heroSection}>
        <h1 className={styles.mainTitle}>Upcoming Events</h1>
        <p className={styles.subTitle}>Join our community and make an impact in person.</p>
        
        {/* Search Input Box */}
        <div className={styles.searchContainer}>
          <input 
            type="text"
            className={styles.eventSearchInput}
            placeholder="Search events by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading && <div className={styles.loaderContainer}><div className={styles.spinner}></div><p>Searching...</p></div>}
      {error && <div className={styles.errorState}><p>Oops! {error}</p></div>}
      {!loading && !error && events.length === 0 && <div className={styles.emptyState}><p>No events found.</p></div>}

      <div className={styles.eventContainer}>
        {!loading && !error && events.map((event) => (
          <div className={styles.eventCard} key={event._id}>
            <div className={styles.imageBox}>
              <img src={getImageUrl(event.imagePath)} alt={event.event_name} />
              <div className={styles.dateBadge}>
                {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.eventTitle}>{event.event_name}</h3>
              <p className={styles.locationText}>📍 {event.event_location || "Online"}</p>
              <div className={styles.eventInfo}>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>{(event.number_of_registrations || 0).toLocaleString()}</span>
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