import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/CareHeader.module.css'; // Using a separate module for the header

const CareHeader = ({ careid }) => {
  return (
    <header className={styles.navbar}>
      <div className={styles.navContainer}>
        <Link to="/" className={styles.logo}>
          Care<span className={styles.logoAccent}>Connect</span>
        </Link>
        
        <nav className={styles.navLinks}>
          <ul className={styles.headerRight}>
            <li>
              <Link to={`/carehome-dashboard/${careid}/edit`} className={styles.navItem}>
                Edit Profile
              </Link>
            </li>
            <li>
              <Link to="/carehome-dashboard/get-job" className={styles.navItem}>
                Create a Job
              </Link>
            </li>
            <li>
              <Link to="/logout" className={styles.logoutBtn}>
                Logout
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default CareHeader;