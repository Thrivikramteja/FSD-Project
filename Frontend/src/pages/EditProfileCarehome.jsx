import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CareHeader from "../components/CareHeader";
import Footer from "../components/footer";
// Import plain CSS (not a module)
import "../styles/carehomes_edit.css"; 

const EditProfile = () => {
  const { careid } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullname: "",
    phne: "",
    mail: "",
    gvtid: "",
    pinc: "",
    bank: "",
    accnum: "",
    ifsc: "",
    state: "",
    city: "",
    wishlist: "",
  });

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });

  const apiKey = "Z3drZDY5RnRqMmgybW9ZQUpFWTdWeGNQTlRHVkU4TlhDRXNHcmlKcQ==";
  const apiUrl = "https://api.countrystatecity.in/v1";

  useEffect(() => {
  // Fetch existing carehome profile
  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/carehome-dashboard/${careid}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();

        // Populate formData with existing values
        setFormData({
          fullname: data.fullname || "",
          phne: data.phne || "",
          mail: data.mail || "",
          gvtid: data.gvtid || "",
          pinc: data.pinc || "",
          bank: data.bank || "",
          accnum: data.accnum || "",
          ifsc: data.ifsc || "",
          state: data.state || "",
          city: data.city || "",
          wishlist: data.wishlist || "",
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  fetchProfile();
}, [careid]);

  // Fetch states on load
  useEffect(() => {
    fetch(`${apiUrl}/countries/IN/states`, {
      headers: { "X-CSCAPI-KEY": apiKey },
    })
      .then((res) => res.json())
      .then((data) => setStates(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  // Fetch cities when state changes
  useEffect(() => {
    if (!formData.state) return;
    fetch(`${apiUrl}/countries/IN/states/${formData.state}/cities`, {
      headers: { "X-CSCAPI-KEY": apiKey },
    })
      .then((res) => res.json())
      .then((data) => setCities(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [formData.state]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    const formatted = name === "wishlist" ? value.replace(/\s{2,}/g, " ") : value;
    setFormData({ ...formData, [name]: formatted });
  };

  // Validation patterns
  const validators = {
    fullname: /.+/,
    phne: /^[0-9]{10}$/,
    mail: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    gvtid: /^[0-9]{6,12}$/,
    pinc: /^[0-9]{6}$/,
    bank: /^[A-Za-z ]+$/,
    accnum: /^[0-9]{8,16}$/,
    ifsc: /^[A-Z]{4}[0-9]{7}$/,
  };

  const validateForm = () => {
    for (const field in validators) {
      if (!validators[field].test(formData[field].trim())) return false;
    }
    return true;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!validateForm()) {
      setMessage({ type: "error", text: "Please correct errors before submitting." });
      return;
    }

    try {
      const response = await fetch(`/api/carehome-dashboard/${careid}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Details updated successfully!" });
      } else {
        const data = await response.json().catch(() => ({}));
        setMessage({ type: "error", text: data.message || "Update failed." });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Network error occurred." });
    }
  };

  return (
    <div className="edits1"> {/* Using plain class name from your CSS */}
      <CareHeader careid={careid} />
      <div className="carehome1"> {/* Plain class from your CSS */}
        <h1>Edit Carehome Profile</h1>

        {message.text && (
          <div
            style={{
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "20px",
              textAlign: "center",
              fontWeight: 600,
              color: message.type === "success" ? "#488d63" : "red",
              backgroundColor: message.type === "success" ? "#e6ffe6" : "#ffe6e6",
            }}
          >
            {message.text}
          </div>
        )}

        <form id="carehomeEditForm" onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input name="fullname" value={formData.fullname} onChange={handleChange} />

          <label>Phone</label>
          <input name="phne" value={formData.phne} onChange={handleChange} />

          <label>Email</label>
          <input name="mail" value={formData.mail} onChange={handleChange} />

          <label>Government ID</label>
          <input name="gvtid" value={formData.gvtid} onChange={handleChange} />

          <label>Pincode</label>
          <input name="pinc" value={formData.pinc} onChange={handleChange} />

          <label>Bank</label>
          <input name="bank" value={formData.bank} onChange={handleChange} />

          <label>Account Number</label>
          <input name="accnum" value={formData.accnum} onChange={handleChange} />

          <label>IFSC</label>
          <input name="ifsc" value={formData.ifsc} onChange={handleChange} />

          <label>State</label>
          <select name="state" value={formData.state} onChange={handleChange}>
            <option value="">Select State</option>
            {states.map((s) => (
              <option key={s.iso2} value={s.iso2}>
                {s.name}
              </option>
            ))}
          </select>

          <label>City</label>
          <select name="city" value={formData.city} onChange={handleChange}>
            <option value="">Select City</option>
            {cities.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <label>Wishlist (comma separated)</label>
          <input name="wishlist" value={formData.wishlist} onChange={handleChange} />

          <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "15px" }}>
            <button type="submit">Update Profile</button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default EditProfile;
