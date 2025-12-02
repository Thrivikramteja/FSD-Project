import React, { useEffect, useState, useContext } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import { headerConfig } from "../config/headerConfig";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../components/authContext";

export default function DonorDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth, updateUser } = useContext(AuthContext);

  const [user, setUser] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  });

  useEffect(() => {
    if (!auth.isLoggedIn) {
      navigate("/login");
      return;
    }

    if (auth.role !== "Donor") {
      navigate("/");
      return;
    }

    const loggedInUser = auth.user;

    if (loggedInUser.userId.toString() !== id.toString()) {
      navigate(`/donor-dashboard/${loggedInUser.userId}`);
      return;
    }

    setUser(loggedInUser);

    setFormData({
      name: loggedInUser.name,
      email: loggedInUser.email,
      phone: loggedInUser.phone || ""
    });

  }, [auth, id, navigate]);

  if (!user) {
    return (
      <>
        <Header navItems={headerConfig.donor} />
        <div className="dashboard-loading">Loading dashboard...</div>
        <Footer />
      </>
    );
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = (e) => {
    e.preventDefault();

    updateUser({
      name: formData.name,
      email: formData.email,
      phone: formData.phone
    });

    setShowEditForm(false);

    setUser((prev) => ({ ...prev, ...formData }));

    console.log("User updated:", formData);
  };

  return (
    <>
      <Header navItems={headerConfig.donor} userName={auth.user.name} />

      <div className="dashboard-container">
        <h1>Welcome, {auth.user.name} </h1>
        
        <section className="dashboard-section">
          <h2>My Donations</h2>
          <p>No donations loaded yet.</p>
        </section>

        <section className="dashboard-section">
          <h2>Notifications</h2>
          <p>No notifications yet.</p>
        </section>

        <section className="dashboard-section">
          <h2>Edit Profile</h2>

          {!showEditForm && (
            <button
              className="edit-profile-btn"
              onClick={() => setShowEditForm(true)}
            >
              Edit My Profile
            </button>
          )}

          {showEditForm && (
            <form className="edit-profile-form" onSubmit={handleSave}>

              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />

              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />

              <label>Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />

              <div className="edit-form-buttons">
                <button type="submit">Save Changes</button>

                <button type="button" onClick={() => setShowEditForm(false)}>
                  Cancel
                </button>
              </div>

            </form>
          )}
        </section>
      </div>

      <Footer />
    </>
  );
}
