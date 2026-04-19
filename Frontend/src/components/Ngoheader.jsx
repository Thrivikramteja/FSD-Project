import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/CareHeader.module.css'; // Importing your shared styles
import NotificationBell from './NotificationBell';

const Header = ({ ngoID }) => {
    const logoWord1 = "Care";
    const logoWord2 = "Connect";
  return (
    <header className={styles.navbar}>
      <div className={styles.navContainer}>
        <Link to="/">
          <div className={styles.logo} onClick={() => navigate("/")}>
                    {logoWord1.split("").map((letter, i) => (
                      <span
                        key={i}
                        className={styles.logoLetter}
                        style={{ animationDelay: `${i * 0.12}s` }}
                      >
                        {letter}
                      </span>
                    ))}
                    {logoWord2.split("").map((letter, i) => (
                      <span
                        key={i}
                        className={styles.logoAccentLetter}
                        style={{ animationDelay: `${(logoWord1.length + i) * 0.12}s` }}
                      >
                        {letter}
                      </span>
                    ))}
              </div>
        </Link>
        
        <nav>
          <ul className={styles.headerRight}>
            <li>
              <Link 
                to={`/NGO-dashboard/${ngoID}/create-fundraiser`} 
                className={styles.navItem}
              >
                Create Fundraiser
              </Link>
            </li>
            <li>
              <Link 
                to={`/NGO-dashboard/${ngoID}/create-event`} 
                className={styles.navItem}
              >
                Create Event
              </Link>
            </li>
            <li>
              <Link 
                to={`/NGO-dashboard/${ngoID}/edit`} 
                className={styles.navItem}
              >
                Edit your profile
              </Link>
            </li>
            <NotificationBell />
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;