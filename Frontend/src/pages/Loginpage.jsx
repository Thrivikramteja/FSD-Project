import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/login.module.css";
import { AuthContext } from "../components/authContext";
import OtpVerification from "./OtpVerification";
import ForgotPassword from "./ForgotPassword";

function Loginpage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    userRole: "Donor",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [tempAuthData, setTempAuthData] = useState(null);
  const [showForgot, setShowForgot] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;

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
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.twoFactorRequired) {
          setTempAuthData({ email: data.email, role: formData.userRole });
          setShowOtp(true);
        } else {
          const userRole = data.role;
          login({ ...data.user, role: data.role });
          // navigate(data.redirect);
          if (userRole === "Admin") {
            navigate("/admin-dashboard"); 
        }
        else {
            // Standard dynamic pathing for other roles
            navigate(data.redirect || "/");
        }
        }
      } else {
        setError(data.message || "Login failed.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");

      setTimeout(() => {
        window.location.href = "/error";
      }, 5000);
    }
  };

  const handleForgotRequest = async (email, role) => {
    setIsVerifying(true);
    setError("");
    try {
      const response = await fetch(
        "http://localhost:3000/api/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, userRole: role }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setTempAuthData({ email, role });
        setShowForgot(false);
        setShowOtp(true);
      } else {
        setError(
          data.message || "User not found. Check email or sign up newly."
        );
      }
    } catch (err) {
      console.log(err);
      setError("Connection error. Please try again.");

      setTimeout(() => {
        window.location.href = "/error";
      }, 5000);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyOtp = async (otpCode) => {
    setIsVerifying(true);
    setError("");

    try {
      const response = await fetch(`http://localhost:3000/api/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: tempAuthData.email,
          otp: otpCode,
          userRole: tempAuthData.role,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        login({ user: data.user, role: data.role });
        if (data.redirect) {
          navigate(data.redirect);
        }
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch (err) {
      console.error(err);
      setError("Verification failed. Please try again.");

      setTimeout(() => {
        window.location.href = "/error";
      }, 5000);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <main className={styles.loginMain}>
        {showForgot && (
          <ForgotPassword
            onClose={() => setShowForgot(false)}
            onEmailSubmit={handleForgotRequest}
            isLoading={isVerifying}
            serverError={error}
          />
        )}

        {showOtp && (
          <OtpVerification
            email={tempAuthData?.email}
            onVerifySuccess={handleVerifyOtp}
            isLoading={isVerifying}
            errorMsg={error}
            onResend={() => console.log("Resending OTP...")}
          />
        )}

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.loginTitle}>
            <h1>Login</h1>
          </div>

          {error && !showOtp && !showForgot && (
            <p className={styles.error}>{error}</p>
          )}

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

          <p
            style={{
              textAlign: "right",
              marginTop: "-10px",
              marginBottom: "15px",
            }}
          >
            <span
              onClick={() => setShowForgot(true)}
              style={{
                color: "#10b981",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
                textDecoration: "underline",
              }}
            >
              Forgot Password?
            </span>
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
