import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Components
import Header from '../components/header';
import Footer from '../components/footer';

// Styles
import '../styles/events.css'; // Make sure this matches your file name

const AllEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Discover", path: "/discover" },
    { label: "Login", path: "/login" },
    { label: "Sign Up", path: "/signup" }
  ];

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Fetch from backend port 3000
        const response = await fetch("http://localhost:3000/events");
        
        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }

        const data = await response.json();
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

  return (
    <div className="event-wrapper">
      <Header navItems={navItems} />

      <h1 style={{ textAlign: 'center', marginTop: '30px', color: '#333' }}>
        Upcoming Events
      </h1>

      {loading && <p style={{ textAlign: 'center' }}>Loading events...</p>}
      {error && <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>}
      {!loading && !error && events.length === 0 && <p style={{ textAlign: 'center' }}>No upcoming events found.</p>}

      <div className="event-container">
        {!loading && !error && events.map((event) => (
          // Use unique key
          <div className="event-card" key={event._id || event.id}>
            
            <h3>{event.event_name}</h3>
            
            <div className="event-info">
              <div>
                {/* Use optional chaining and fallback for safety */}
                <h4>{(event.number_of_registrations || 0).toLocaleString()}</h4>
                <p>Supporters</p>
              </div>
            </div>

            <div className="event-buttons">
              {/* Converted to React Router Link */}
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