import { useNavigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../components/authContext";
import styles from "./Header.module.css";

const Header = ({ navItems }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, logout } = useContext(AuthContext);

  const isLandingPage = location.pathname === "/";

  // Choose dashboard URL based on role
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
        dashboardPath = `/admin-dashboard/${auth.user.userId}`;
        break;
      default:
        break;
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles["app-name"]} onClick={() => navigate("/")}>
        CareConnect
      </div>

      <nav>
        <ul className={styles["nav-items"]}>
          {navItems.map((item) => (
            <li key={item.label}>
              {item.onClick ? (
                <button onClick={item.onClick}>{item.label}</button>
              ) : item.path ? (
                <a href={item.path}>{item.label}</a>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          ))}

          <li>
            {auth.isLoggedIn ? (
              <>
                {/* Show DASHBOARD button only on landing page */}
                {isLandingPage && (
                  <button style={{paddingRight: "24px"}} onClick={() => navigate(dashboardPath)}>
                    Dashboard
                  </button>
                )}

                <span>{auth.user?.name}</span>
                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>

                {/* Sign Up ONLY on landing page */}
                {isLandingPage && (
                  <button style={{paddingRight: "24px"}} onClick={() => navigate("/signup")}>
                    Sign Up
                  </button>
                )}

                <button onClick={() => navigate("/login")}>Login</button>
              </>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;


