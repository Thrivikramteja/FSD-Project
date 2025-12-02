import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/login.module.css";
import { AuthContext } from "../components/authContext";

function Loginpage() {
  const { login } = useContext(AuthContext);   // ⬅ use login() instead of setAuth()
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    userRole: "Donor",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const emailPattern =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailPattern.test(formData.email.trim())) {
      setError("Enter a valid email address.");
      return false;
    }

    if (formData.password.trim().length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const response = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Login successful:", data);

        // ⭐ Correct way to set logged-in user
        login({
          ...data.user,
          role: data.role,      // ensure role is saved
        });

        navigate(data.redirect);
      } else {
        setError(data.message || "Login failed.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className={styles.loginPage}>
      <main className={styles.loginMain}>
        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.loginTitle}>
            <h1>Login</h1>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <p className={styles.loginAs}>
            Login As:
            <br />
            <select
              name="userRole"
              className={styles.roleSelect}
              value={formData.userRole}
              onChange={handleChange}
            >
              <option value="Donor">Donor</option>
              <option value="NGO">NGO</option>
              <option value="Carehome">Carehome</option>
              <option value="Admin">Admin</option>
            </select>
          </p>

          <p>
            <label className={styles.loginLabel}>E-Mail</label>
            <br />
            <input
              className={styles.loginInput}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </p>

          <p>
            <label className={styles.loginLabel}>Password</label>
            <br />
            <input
              className={styles.loginInput}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </p>

          <button type="submit" className={styles.loginButton}>
            Login
          </button>
        </form>
      </main>
    </div>
  );
}

export default Loginpage;
