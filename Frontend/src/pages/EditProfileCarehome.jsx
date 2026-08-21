import { apiFetch } from "../services/api";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import CareHeader from "../components/CareHeader";
import Footer from "../components/footer";
import "../styles/carehomes_edit.css";

const EditProfile = () => {
  const { careid } = useParams();

  const [formData, setFormData] = useState({
    fullname: "",
    phne: "",
    mail: "",
    ifsc: "",
  });

  const [message, setMessage] = useState({ type: "", text: "" });
  const [error, setError] = useState(null); // NEW

  /* ================= FETCH EXISTING DATA ================= */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiFetch(`/api/carehome/profile/${careid}`, {
          credentials: "include",
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Failed to load profile");
        }

        const data = await res.json();

        setFormData({
          fullname: data.care_home_name || "",
          phne: data.contact || "",
          mail: data.email || "",
          ifsc: data.ifsc || "",
        });

      } catch (err) {
        console.error("FETCH ERROR:", err);

        setError(err.message || "Profile fetch failed");

        setTimeout(() => {
          window.location.href = "/error";
        }, 5000);
      }
    };

    fetchProfile();
  }, [careid]);

  /* ================= HANDLE CHANGE ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ================= VALIDATION ================= */
  const validators = {
    fullname: /.+/,
    phne: /^[0-9]{10}$/,
    mail: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    ifsc: /^[A-Z]{4}[0-9]{7}$/,
  };

  const validateForm = () => {
    for (const field in validators) {
      if (!validators[field].test(formData[field].trim())) {
        return false;
      }
    }
    return true;
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!validateForm()) {
      setMessage({ type: "error", text: "Please enter valid details" });
      return;
    }

    try {
      const response = await apiFetch(`/api/carehome/${careid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Update failed");
      }

      setMessage({ type: "success", text: "Profile updated successfully" });

    } catch (err) {
      console.error(err);

      setMessage({ type: "error", text: err.message || "Network error" });

      setTimeout(() => {
        window.location.href = "/error";
      }, 5000);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="edits1">
      <CareHeader careid={careid} />

      <div className="carehome1">
        <h1>Edit Carehome Profile</h1>

        {error && (
          <p style={{ color: "red", textAlign: "center" }}>
            Error: {error}
          </p>
        )}

        {message.text && (
          <div
            style={{
              padding: "12px",
              marginBottom: "20px",
              borderRadius: "8px",
              textAlign: "center",
              fontWeight: "600",
              color: message.type === "success" ? "green" : "red",
              backgroundColor:
                message.type === "success" ? "#e6ffe6" : "#ffe6e6",
            }}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input
            name="fullname"
            value={formData.fullname}
            onChange={handleChange}
            required
          />

          <label>Phone</label>
          <input
            name="phne"
            value={formData.phne}
            onChange={handleChange}
            required
          />

          <label>Email</label>
          <input
            name="mail"
            value={formData.mail}
            onChange={handleChange}
            required
          />

          <label>IFSC</label>
          <input
            name="ifsc"
            value={formData.ifsc}
            onChange={handleChange}
            required
          />

          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button type="submit">Update Profile</button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default EditProfile;
