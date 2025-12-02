import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/header';
import Footer from '../components/footer';
import '../styles/donor_reg.css'; 

const DonorRegistration = () => {
  const { ngoId, eventName } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    number: '',
    age: '',
    address: '',
    terms: false
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // POST request to backend
      const response = await fetch(`http://localhost:3000/registerUser/${ngoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          event: decodeURIComponent(eventName), // Ensure event name is clean
          ngoID: ngoId
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Registration Successful!");
        navigate('/'); // Redirect to home
      } else {
        alert(data.message || "Registration Failed");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Discover", path: "/discover" },
    { label: "Events", path: "/events" }
  ];

  return (
    <div>
      <Header navItems={navItems} />

      <div className="donor-reg-wrapper">
        <div className="donor-reg-container">
          <h2 className="donor-reg-title">
            Register for: {eventName ? decodeURIComponent(eventName) : "Event"}
          </h2>

          <form className="donor-reg-form" onSubmit={handleSubmit}>
            <input 
              type="text" name="name" placeholder="Full Name" required 
              className="donor-reg-input"
              value={formData.name} onChange={handleChange}
            />

            <input 
              type="email" name="email" placeholder="Email" required 
              className="donor-reg-input"
              value={formData.email} onChange={handleChange}
            />

            <input 
              type="text" name="number" placeholder="Phone Number" required 
              className="donor-reg-input"
              value={formData.number} onChange={handleChange}
            />

            <input 
              type="number" name="age" placeholder="Age" required 
              className="donor-reg-input"
              value={formData.age} onChange={handleChange}
            />

            <input 
              type="text" name="address" placeholder="Address" required 
              className="donor-reg-input"
              value={formData.address} onChange={handleChange}
            />

            <label className="donor-reg-label">
              <input 
                type="checkbox" name="terms" required 
                className="donor-reg-checkbox"
                checked={formData.terms} onChange={handleChange}
              />
              I agree to the Terms and Conditions
            </label>

            <button type="submit" className="donor-reg-btn" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DonorRegistration;