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
  const [applications, setApplications] = useState([]);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // --- ADDED FETCH FUNCTION ---
  const downloadReceipt = async (type, id) => {
    try {
      const response = await fetch(`https://fsd-project-backend-2bms.onrender.com/api/receipts/${type}/${id}`, {
        credentials: "include",
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `CareConnect_${type}_Receipt.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download Error:", err);
    }
  };

  useEffect(() => {
    if (auth.loading) return;

    if (!auth.user) {
      navigate("/login");
      return;
    }

    const loggedInUser = auth.user;
    const currentId = loggedInUser.userId || loggedInUser._id;

    if (currentId.toString() !== id.toString()) {
      navigate(`/donor-dashboard/${currentId}`);
      return;
    }

    setUser(loggedInUser);
    setFormData({
      name: loggedInUser.name,
      email: loggedInUser.email,
      phone: loggedInUser.mobile_number || loggedInUser.phone || "",
    });
  }, [auth, id, navigate]);

  useEffect(() => {
    if (!user) return;

    fetch(`https://fsd-project-backend-2bms.onrender.com/api/activity/${user.userId}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setActivity(data.data);
        }
      })
      .catch((err) => console.error("Activity Fetch Error:", err));

    fetch(`https://fsd-project-backend-2bms.onrender.com/my-applications`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setApplications(data.applications);
        }
      })
      .catch((err) => console.error("Applications Fetch Error:", err));
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

  const handleSave = async (e) => {
    e.preventDefault();

    if (!user?.userId) {
      setSaveError("Unable to identify this donor profile.");
      return;
    }

    try {
      setIsSaving(true);
      setSaveError("");

      const response = await fetch(`https://fsd-project-backend-2bms.onrender.com/api/donor/${user.userId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullname: formData.name,
          mail: formData.email,
          phone: formData.phone,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update donor profile.");
      }

      const savedUser = {
        ...user,
        ...(result.user || {}),
        name: result.user?.name ?? formData.name,
        email: result.user?.email ?? formData.email,
        mobile_number:
          result.user?.mobile_number ??
          result.user?.phone ??
          formData.phone,
      };

      updateUser(savedUser);
      setUser(savedUser);
      setFormData({
        name: savedUser.name || "",
        email: savedUser.email || "",
        phone: savedUser.mobile_number || savedUser.phone || "",
      });
      setShowEditForm(false);
    } catch (error) {
      console.error("Donor profile update failed:", error);
      setSaveError(error.message || "Failed to update donor profile.");
    } finally {
      setIsSaving(false);
    }
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
            
            {/* Job Applications */}
            <section className={styles.contentSection}>
              <h2 className={styles.sectionTitle}>My Job Applications</h2>
              <div className={styles.cardGrid}>
                {applications.length > 0 ? (
                  applications.map((app) => (
                    <div key={app._id} className={styles.dataCard}>
                      <div className={styles.appHeader}>
                        <h4>{app.jobId?.title || "Position Unavailable"}</h4>
                        <span className={`${styles.statusBadge} ${styles[app.status?.toLowerCase()]}`}>
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

            {/* Money Donations */}
            <section className={styles.contentSection}>
              <h2 className={styles.sectionTitle}>Money Donations</h2>
              <div className={styles.cardGrid}>
                {activity?.donations_money?.length > 0 ? (
                  activity.donations_money.map((d) => (
                    <div key={d._id} className={styles.dataCard}>
                      <h4 style={{ color: '#2c3e50', marginBottom: '8px' }}>
                        {d.carehomeDetails?.care_home_name || "Care Home"}
                      </h4>
                      <p className={styles.highlightText}>Amount: ₹{d.amount_donated}</p>
                      <p>Date: {new Date(d.donated_at).toDateString()}</p>
                      {/* ADDED BUTTON */}
                      <button className={styles.receiptBtn} onClick={() => downloadReceipt('direct', d._id)}>Download Receipt</button>
                    </div>
                  ))
                ) : <p className={styles.noData}>No money donations yet.</p>}
              </div>
            </section>


            <section className={styles.contentSection}>
              <h2 className={styles.sectionTitle}>Fundraiser Contributions</h2>
              <div className={styles.cardGrid}>
                {activity?.contributedFundraisers?.length > 0 ? (
                  activity.contributedFundraisers.map((fund) => (
                    <div key={fund._id} className={styles.dataCard}>
                      <div className={styles.appHeader}>
                        <h4 style={{ color: '#1e293b' }}>{fund.fundraiser_name}</h4>
                        <span className={`${styles.statusBadge} ${styles.completed}`}>Fundraiser</span>
                      </div>
                      

                      <p><strong>NGO:</strong> {fund.ngoName || "Partner NGO"}</p>
                      
                      <p className={styles.highlightText}>
                        Contributed: ₹{fund.amount_contributed}
                      </p>
                      
                      <p>Date: {new Date(fund.contributed_at).toLocaleDateString()}</p>
                      
                      <button 
                        className={styles.receiptBtn} 
                        onClick={() => downloadReceipt('fundraiser', fund._id)}
                      >
                        Download Receipt
                      </button>
                    </div>
                  ))
                ) : (
                  <p className={styles.noData}>No fundraiser contributions yet.</p>
                )}
              </div>
            </section>


            <section className={styles.contentSection}>
              <h2 className={styles.sectionTitle}>Item Donations</h2>
              <div className={styles.cardGrid}>
                {activity?.donations_items?.length > 0 ? (
                  activity.donations_items.map((item) => (
                    <div key={item._id} className={styles.dataCard}>
                      <h4 style={{ color: '#27ae60', marginBottom: '8px' }}>
                        {item.carehomeDetails?.care_home_name || "Care Home"}
                      </h4>
                      <p><strong>Category:</strong> {item.category}</p>
                      <p>Description: {item.description || "No description"}</p>
                      <p>Delivery: {new Date(item.delivery).toDateString()}</p>
                      <p>Location: {item.location}</p>
                    </div>
                  ))
                ) : <p className={styles.noData}>No item donations yet.</p>}
              </div>
            </section>
{/* --- SECTION: UPCOMING REGISTERED EVENTS --- */}
<section className={styles.contentSection}>
  <div className={styles.sectionHeader}>
    <h2 className={styles.sectionTitle}>Upcoming Registered Events</h2>
  </div>

  <div className={styles.cardGrid}>
    {activity?.events_upcoming?.length > 0 ? (
      activity.events_upcoming.map((registration) => {
        // 'eventObjectId' is the populated field from your Donor Controller
        const eventDetails = registration.eventObjectId;

        return (
          <div key={registration._id} className={styles.dataCard} style={{ borderLeft: '5px solid #28a745' }}>
            <div className={styles.appHeader}>
              <h4 style={{ color: '#1a202c', margin: '0 0 10px 0' }}>
                {eventDetails?.event_name || "Event Title"}
              </h4>
              <span className={`${styles.statusBadge} ${styles.pending}`}>
                Registered
              </span>
            </div>

            <div style={{ marginBottom: '15px', fontSize: '0.9rem', color: '#4a5568' }}>
              <p style={{ margin: '4px 0' }}>
                <strong> Date:</strong> {eventDetails?.event_date ? new Date(eventDetails.event_date).toDateString() : "Date TBD"}
              </p>
              <p style={{ margin: '4px 0' }}>
                <strong> Location:</strong> {eventDetails?.event_location || "Venue details to follow"}
              </p>
              <p style={{ margin: '4px 0' }}>
                <strong> Organized by:</strong> {registration.ngoName || "Partner NGO"}
              </p>
            </div>

            {/* THE "ABOUT" DETAILS BOX */}
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#f7fafc', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0' 
            }}>
              <p style={{ fontSize: '0.85rem', lineHeight: '1.5', margin: 0, color: '#2d3748' }}>
                <strong>About this Event:</strong><br />
                {eventDetails?.description || "No specific description provided. Please contact the NGO for more details."}
              </p>
            </div>
          </div>
        );
      })
    ) : (
      <div className={styles.noDataBox} style={{ textAlign: 'center', padding: '30px' }}>
        <p className={styles.noData}>You have no upcoming registered events.</p>
        <Link to="/events" className={styles.discoverLink} style={{ fontWeight: 'bold', color: '#2f855a' }}>
          Browse & Register for Events →
        </Link>
      </div>
    )}
  </div>
</section>
            {/* Events Participated */}
            <section className={styles.contentSection}>
              <h2 className={styles.sectionTitle}>Events Participated</h2>
              <div className={styles.cardGrid}>
                {activity?.events_participated?.length > 0 ? (
                  activity.events_participated.map((evt) => (
                    <div key={evt._id} className={styles.dataCard}>
                      <h4>{evt.eventObjectId?.event_name || evt.event_name}</h4>
                      <p>Date: {new Date(evt.eventObjectId?.event_date || evt.event_date).toDateString()}</p>
                      <p>Location: {evt.eventObjectId?.event_location || evt.event_location}</p>
                      {/* ADDED BUTTON */}
                      <button className={styles.receiptBtn} onClick={() => downloadReceipt('event', evt._id)}>Download Certificate</button>
                    </div>
                  ))
                ) : <p className={styles.noData}>No participated events.</p>}
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
                    <p><strong>Phone:</strong> {user.mobile_number || user.phone || "N/A"}</p>
                    <button className={styles.editBtn} onClick={() => setShowEditForm(true)}>
                      Edit My Profile
                    </button>
                  </div>
                ) : (
                  <form className={styles.editForm} onSubmit={handleSave}>
                    {saveError ? <p className={styles.noData}>{saveError}</p> : null}
                    <label>Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} />
                    <label>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} />
                    <label>Phone</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
                    <div className={styles.formActions}>
                      <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={() => {
                          setSaveError("");
                          setShowEditForm(false);
                        }}
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
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
