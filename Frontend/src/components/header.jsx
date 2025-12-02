import { useNavigate } from "react-router-dom";
import styles from "./Header.module.css";

const Header = ({ navItems, userName, onLogout }) => {
  const navigate = useNavigate();
  return (
    <header className={styles.header}>
      <div className={styles["app-name"]} onClick={() => navigate('/')}>CareConnect</div>

      <nav>
        <ul className={styles["nav-items"]}>
          {navItems.map((item) => (
            <li key={item.label}>
              {item.path ? (
                <a href={item.path}>{item.label}</a>
              ) : (
                <button onClick={item.onClick}>{item.label}</button>
              )}
            </li>
          ))}
          <li>
            {userName ? (
              <>
                <span>{userName}</span>
                <button onClick={() => navigate('/')}>Logout</button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login')}>Login</button>
              </>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;


