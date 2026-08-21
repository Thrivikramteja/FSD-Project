import { apiFetch } from "../services/api";
import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../components/authContext";
import styles from "../styles/CareHeader.module.css";
import NotificationBell from './NotificationBell';


const CareHeader = ({ careid }) => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiFetch("/api/logout", { method: "POST", credentials: "include" });
    } catch (err) {
      console.error("Logout failed", err);
    }

    // Update context + clear storage
    logout();

    // Redirect to login
    navigate("/login");
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.navContainer}>
        <Link to="/" className={styles.logo}>
          Care<span className={styles.logoAccent}>Connect</span>
        </Link>
        <nav className={styles.navLinks}>
          <ul className={styles.headerRight}>
            <li>
              <Link
                to={`/carehome-dashboard/${careid}/edit`}
                className={styles.navItem}
              >
                Edit Profile
              </Link>
            </li>
            <li>
              <Link to="/carehome-dashboard/get-job" className={styles.navItem}>
                Create a Job
              </Link>
            </li>
            <li>
              <Link to="/impact-stories" className={styles.navItem}>
                Impact Stories
              </Link>
            </li>
            <NotificationBell />
            <li>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default CareHeader;
