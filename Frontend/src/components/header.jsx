import React, { useContext } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { AuthContext } from "../components/authContext";
import styles from "../styles/CareHeader.module.css"; 
import NotificationBell from './NotificationBell';


const Header = ({ navItems = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, logout } = useContext(AuthContext);
  const logoWord1 = "Care";
  const logoWord2 = "Connect";
  const isLandingPage = location.pathname === "/";

  // --- LOGIC PRESERVED: Role-based Dashboard Pathing ---
  let dashboardPath = "/";
  if (auth.user) {
    switch (auth.role) {
      case "Donor":
        dashboardPath = `/donor-dashboard/${auth.user.userId}`;
        break;
      case "NGO":
        dashboardPath = `/NGO-dashboard/${auth.user.ngoId}`;
        break;
      case "Carehome":
        dashboardPath = `/carehome-dashboard/${auth.user.carehomeId}`;
        break;
      case "Admin":
        dashboardPath = "/admin-dashboard";
        break;
      default:
        break;
    }
  }

  return (
    <header className={styles.navbar}>
      <div className={styles.navContainer}>

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

        <nav>
          <ul className={styles.headerRight}>
            {navItems.map((item) => (
              <li key={item.label} className={item.subItems ? styles.dropdown : ""}>
                {item.onClick ? (
                  <button className={styles.navButton} onClick={item.onClick}>
                    {item.label}
                  </button>
                ) : item.subItems ? (
                  <>
                    <a href={item.path} className={styles.navItem}>
                      {item.label} <span className={styles.arrow}>▾</span>
                    </a>
                    <ul className={styles.dropdownMenu}>
                      {item.subItems.map((sub) => (
                        <li key={sub.label}>
                          <a href={sub.path}>{sub.label}</a>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : item.path ? (
                  <a href={item.path} className={styles.navItem}>{item.label}</a>
                ) : (
                  <span className={styles.navItem}>{item.label}</span>
                )}
              </li>
            ))}

            {/* --- LOGIC PRESERVED: Auth Conditional Rendering --- */}
            {auth.user ? (
              <>
                {/* Dashboard button only on landing page */}
                {isLandingPage && (
                  <li>
                    <button className={styles.navButton} onClick={() => navigate(dashboardPath)}>
                      Dashboard
                    </button>
                  </li>
                )}
                   <NotificationBell />
                <li className={styles.userName}>{auth.user?.name}</li>
                
                <li>
                  <button
                    className={styles.logoutBtn}
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                {/* Sign Up only on landing page */}
                {isLandingPage && (
                  <li>
                    <button className={styles.navButton} onClick={() => navigate("/signup")}>
                      Sign Up
                    </button>
                  </li>
                )}
                <li>
                  <button className={styles.loginBtn} onClick={() => navigate("/login")}>
                    Login
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;