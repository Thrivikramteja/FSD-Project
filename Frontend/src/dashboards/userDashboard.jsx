import React, { useEffect, useState, useContext } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import { headerConfig } from "../config/headerConfig";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../components/authContext";
import "./userDashboard.css"

export default function DonorDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth, updateUser } = useContext(AuthContext);

  const [user, setUser] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [activity, setActivity] = useState(null); 

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

  useEffect(() => {
    if (user) {
      fetch(`http://localhost:3000/api/activity/${user.userId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setActivity(data.data);
          }
        })
        .catch((err) => console.error("Error fetching activity:", err));
    }
  }, [user]);

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
          <h2>Events Participated</h2>
          {activity?.events_participated?.length > 0 ? (
            activity.events_participated.map((evt) => (
              <div key={evt._id} className="activity-card">
                <h4>{evt.event_name}</h4>
                <p>Date: {new Date(evt.event_date).toDateString()}</p>
                <p>Location: {evt.event_location}</p>
              </div>
            ))
          ) : (
            <p>No participated events.</p>
          )}
        </section>

        <section className="dashboard-section">
          <h2>Upcoming Events</h2>
          {activity?.events_upcoming?.length > 0 ? (
            activity.events_upcoming.map((evt) => (
              <div key={evt._id} className="activity-card">
                <h4>{evt.event_name}</h4>
                <p>Date: {new Date(evt.event_date).toDateString()}</p>
                <p>Location: {evt.event_location}</p>
              </div>
            ))
          ) : (
            <p>No upcoming events.</p>
          )}
        </section>

        <section className="dashboard-section">
          <h2>Contributed Fundraisers</h2>
          {activity?.fundraisers_contributed?.length > 0 ? (
            activity.fundraisers_contributed.map((f) => (
              <div key={f._id} className="activity-card">
                <h4>{f.fundraiser_name}</h4>
                <p>Amount: ₹{f.amount_contributed}</p>
                <p>Deadline: {new Date(f.deadline).toDateString()}</p>
              </div>
            ))
          ) : (
            <p>No fundraiser contributions.</p>
          )}
        </section>

        <section className="dashboard-section">
          <h2>Money Donations</h2>
          {activity?.donations_money?.length > 0 ? (
            activity.donations_money.map((d) => (
              <div key={d._id} className="activity-card">
                <p>Amount: ₹{d.amount_donated}</p>
                <p>Date: {new Date(d.donated_at).toDateString()}</p>
              </div>
            ))
          ) : (
            <p>No money donations yet.</p>
          )}
        </section>

        <section className="dashboard-section">
          <h2>Item Donations</h2>
          {activity?.donations_items?.length > 0 ? (
            activity.donations_items.map((item) => (
              <div key={item._id} className="activity-card">
                <h4>{item.category}</h4>
                <p>Description: {item.description || "No description"}</p>
                <p>Delivery: {new Date(item.delivery).toDateString()}</p>
                <p>Location: {item.location}</p>
              </div>
            ))
          ) : (
            <p>No item donations yet.</p>
          )}
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
              <input type="text" name="name" value={formData.name} onChange={handleChange} />

              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} />

              <label>Phone</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} />

              <div className="edit-form-buttons">
                <button type="submit">Save Changes</button>
                <button type="button" onClick={() => setShowEditForm(false)}>Cancel</button>
              </div>
            </form>
          )}
        </section>
      </div>

      <Footer />
    </>
  );
}
