import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/CareHeader.module.css'; // Importing your shared styles

const Header = ({ ngoID }) => {
  return (
    <header className={styles.navbar}>
      <div className={styles.navContainer}>
        <Link to="/" className={styles.logo}>
          Care<span className={styles.logoAccent}>Connect</span>
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
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;