import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import { headerConfig } from "../config/headerConfig";
import { AuthContext } from "../components/authContext";
import styles from "../styles/userDashboard.module.css"; 

export default function DonorDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth, updateUser } = useContext(AuthContext);

  const [user, setUser] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [activity, setActivity] = useState(null);
  const [applications, setApplications] = useState([]); // New state for jobs

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (auth.loading) return;

    if (!auth.user) {
      navigate("/login");
      return;
    }

    const loggedInUser = auth.user;
    const currentId = loggedInUser._id || loggedInUser.userId;

    if (currentId.toString() !== id.toString()) {
      navigate(`/donor-dashboard/${currentId}`);
      return;
    }

    setUser(loggedInUser);
    setFormData({
      name: loggedInUser.name,
      email: loggedInUser.email,
      phone: loggedInUser.phone || "",
    });
  }, [auth, id, navigate]);

  useEffect(() => {
    if (!user) return;

    // Fetch general activity
    fetch(`http://localhost:3000/api/activity/${user.userId}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setActivity(data.data);
        }
      })
      .catch(() => {});

    // NEW: Fetch job applications
    fetch(`http://localhost:3000/my-applications`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setApplications(data.applications);
        }
      })
      .catch(() => {});
  }, [user]);

  if (auth.loading || !user) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading Donor Dashboard...</p>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateUser({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
    });
    setUser((prev) => ({ ...prev, ...formData }));
    setShowEditForm(false);
  };

  return (
    <div className={styles.pageWrapper}>
      <Header navItems={headerConfig.donor} userName={auth.user.name} />

      <main className={styles.mainContent}>
        <header className={styles.dashboardHeader}>
          <h1>Welcome, {auth.user.name}</h1>
        </header>

        <div className={styles.dashboardLayout}>
          <div className={styles.activityColumn}>
            
            {/* NEW: Job Applications Section */}
            <section className={styles.contentSection}>
              <h2 className={styles.sectionTitle}>My Job Applications</h2>
              <div className={styles.cardGrid}>
                {applications.length > 0 ? (
                  applications.map((app) => (
                    <div key={app._id} className={styles.dataCard}>
                      <div className={styles.appHeader}>
                        <h4>{app.jobId?.title || "Deleted Position"}</h4>
                        <span className={`${styles.statusBadge} ${styles[app.status.toLowerCase()]}`}>
                          {app.status}
                        </span>
                      </div>
                     <p>
  <strong>Carehome:</strong>{" "}
  <Link 
    to={`/carehomes/viewcare/${app.carehomeId?.carehomeId}`}
    style={{ color: "#2f855a", fontWeight: "600" }}
  >
    {app.carehomeName}
  </Link>
</p>



                      <p>Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
                    </div>
                  ))
                ) : <p className={styles.noData}>No job applications yet.</p>}
              </div>
            </section>

            {/* Events Participated */}
            <section className={styles.contentSection}>
              <h2 className={styles.sectionTitle}>Events Participated</h2>
              <div className={styles.cardGrid}>
                {activity?.events_participated?.length > 0 ? (
                  activity.events_participated.map((evt) => (
                    <div key={evt._id} className={styles.dataCard}>
                      <h4>{evt.event_name}</h4>
                      <p>Date: {new Date(evt.event_date).toDateString()}</p>
                      <p>Location: {evt.event_location}</p>
                    </div>
                  ))
                ) : <p className={styles.noData}>No participated events.</p>}
              </div>
            </section>

            {/* Upcoming Events */}
            <section className={styles.contentSection}>
              <h2 className={styles.sectionTitle}>Upcoming Events</h2>
              <div className={styles.cardGrid}>
                {activity?.events_upcoming?.length > 0 ? (
                  activity.events_upcoming.map((evt) => (
                    <div key={evt._id} className={styles.dataCard}>
                      <h4>{evt.event_name}</h4>
                      <p>Date: {new Date(evt.event_date).toDateString()}</p>
                      <p>Location: {evt.event_location}</p>
                    </div>
                  ))
                ) : <p className={styles.noData}>No upcoming events.</p>}
              </div>
            </section>

            {/* Contributed Fundraisers */}
            <section className={styles.contentSection}>
              <h2 className={styles.sectionTitle}>Contributed Fundraisers</h2>
              <div className={styles.cardGrid}>
                {activity?.fundraisers_contributed?.length > 0 ? (
                  activity.fundraisers_contributed.map((f) => (
                    <div key={f._id} className={styles.dataCard}>
                      <h4>{f.fundraiser_name}</h4>
                      <p>Amount: ₹{f.amount_contributed}</p>
                      <p>Deadline: {new Date(f.deadline).toDateString()}</p>
                    </div>
                  ))
                ) : <p className={styles.noData}>No fundraiser contributions.</p>}
              </div>
            </section>

            {/* Money Donations */}
            <section className={styles.contentSection}>
              <h2 className={styles.sectionTitle}>Money Donations</h2>
              <div className={styles.cardGrid}>
                {activity?.donations_money?.length > 0 ? (
                  activity.donations_money.map((d) => (
                    <div key={d._id} className={styles.dataCard}>
                      <p className={styles.highlightText}>Amount: ₹{d.amount_donated}</p>
                      <p>Date: {new Date(d.donated_at).toDateString()}</p>
                    </div>
                  ))
                ) : <p className={styles.noData}>No money donations yet.</p>}
              </div>
            </section>

            {/* Item Donations */}
            <section className={styles.contentSection}>
              <h2 className={styles.sectionTitle}>Item Donations</h2>
              <div className={styles.cardGrid}>
                {activity?.donations_items?.length > 0 ? (
                  activity.donations_items.map((item) => (
                    <div key={item._id} className={styles.dataCard}>
                      <h4>{item.category}</h4>
                      <p>Description: {item.description || "No description"}</p>
                      <p>Delivery: {new Date(item.delivery).toDateString()}</p>
                      <p>Location: {item.location}</p>
                    </div>
                  ))
                ) : <p className={styles.noData}>No item donations yet.</p>}
              </div>
            </section>
          </div>

          <aside className={styles.sidebarColumn}>
            <section className={styles.stickyProfile}>
              <div className={styles.profileCard}>
                <h2>Donor Profile</h2>
                {!showEditForm ? (
                  <div className={styles.profileView}>
                    <p><strong>Name:</strong> {user.name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Phone:</strong> {user.phone || "N/A"}</p>
                    <button className={styles.editBtn} onClick={() => setShowEditForm(true)}>
                      Edit My Profile
                    </button>
                  </div>
                ) : (
                  <form className={styles.editForm} onSubmit={handleSave}>
                    <label>Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} />
                    <label>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} />
                    <label>Phone</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
                    <div className={styles.formActions}>
                      <button type="submit" className={styles.saveBtn}>Save</button>
                      <button type="button" className={styles.cancelBtn} onClick={() => setShowEditForm(false)}>Cancel</button>
                    </div>
                  </form>
                )}
              </div>
            </section>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}