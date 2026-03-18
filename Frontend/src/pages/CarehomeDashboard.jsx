import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import CareHeader from "../components/CareHeader";
import Footer from "../components/footer";
import styles from "../styles/CarehomeDashboard.module.css";

const CarehomeDashboard = () => {
  const { careid } = useParams();
  const [data, setData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- NEW STATE: For the Item Request Pop-up ---
  const [selectedMsg, setSelectedMsg] = useState(null);

  // --- NEW STATE: For Impact Stories ---
  const [storyTitle, setStoryTitle] = useState('');
  const [storyDescription, setStoryDescription] = useState('');
  const [storyFiles, setStoryFiles] = useState([]);

  const fetchData = async () => {
    try {
      const dashRes = await fetch(
        `http://localhost:3000/api/carehome-dashboard/${careid}`,
        { credentials: "include" }
      );
      const jobsRes = await fetch(
        `http://localhost:3000/api/carehome/my-jobs`,
        { credentials: "include" }
      );

      if (dashRes.ok && jobsRes.ok) {
        const dashResult = await dashRes.json();
        const jobsResult = await jobsRes.json();
        setData(dashResult);
        setJobs(jobsResult.jobs || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [careid]);

  const handleViewApplicants = async (jobId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/carehome/jobs/${jobId}/applicants`,
        { credentials: "include" }
      );
      const result = await response.json();
      if (result.success) {
        setApplicants(result.applicants);
        setSelectedJobId(jobId);
      }
    } catch (error) {
      console.error("Error fetching applicants:", error);
    }
  };

  const handleAcceptApplication = async (app) => {
    setApplicants((prev) =>
      prev.map((a) => (a._id === app._id ? { ...a, status: "Accepted" } : a))
    );
    await fetch(`http://localhost:3000/api/applications/${app._id}/accept`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
  };

  const handleRejectApplication = async (app) => {
    setApplicants((prev) =>
      prev.map((a) => (a._id === app._id ? { ...a, status: "Rejected" } : a))
    );
    await fetch(`http://localhost:3000/api/applications/${app._id}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
  };

  const handleItemAction = async (msg, action) => {
    try {
      const response = await fetch("http://localhost:3000/donate_item/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: action,
          carehomeId: careid,
          userId: msg.userId,
          category: msg.category,
          delivery_date: msg.delivery_date,
          location: msg.location,
          description: msg.description,
        }),
      });
      if (response.ok) {
        alert(`Request ${action === "accept" ? "approved" : "declined"} successfully`);
        setSelectedMsg(null); // Close modal on success
        fetchData();
      }
    } catch (error) {
      console.error("Error processing item action:", error);
    }
  };

  const handleUploadStory = async () => {
    const formData = new FormData();
    formData.append('title', storyTitle);
    formData.append('description', storyDescription);
    storyFiles.forEach(file => formData.append('media', file));
    try {
      const response = await fetch('http://localhost:3000/api/carehome/impact-story', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (response.ok) {
        alert('Story uploaded!');
        setStoryTitle('');
        setStoryDescription('');
        setStoryFiles([]);
      }
    } catch (error) {
      console.error('Error uploading story:', error);
    }
  };

  if (loading) return <div className={styles.loader}>Loading Premium Dashboard...</div>;
  if (!data) return <div className={styles.error}>No dashboard data found.</div>;

  return (
    <div className={styles.pageWrapper}>
      <CareHeader careid={careid} />

      {/* --- ITEM REQUEST MODAL (Only shows when selectedMsg is not null) --- */}
      {selectedMsg && (
        <div className={styles.modalOverlay} onClick={() => setSelectedMsg(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Donation Request Details</h3>
              <button className={styles.closeBtn} onClick={() => setSelectedMsg(null)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <p><strong>Category:</strong> {selectedMsg.category}</p>
              <p><strong>Location:</strong> {selectedMsg.location}</p>
              <p><strong>Delivery Date:</strong> {selectedMsg.delivery_date || "Not Specified"}</p>
              <div className={styles.modalDescriptionBox}>
                 <strong>Description:</strong>
                 <p>{selectedMsg.description}</p>
              </div>
            </div>
            <div className={styles.btnGroupModal}>
              <button className={styles.acceptBtn} onClick={() => handleItemAction(selectedMsg, "accept")}>
                Approve
              </button>
              <button className={styles.rejectBtn} onClick={() => handleItemAction(selectedMsg, "reject")}>
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      <header className={styles.dashboardHeader}>
        <h1 className={styles.mainTitle}>{data.name}</h1>
        <p className={styles.subtitle}>Management Console</p>
      </header>

      <div className={styles.container}>
        <aside className={styles.wishlistSidebar}>
          <h2>Wishlist of Needs</h2>
          <div className={styles.wishlistContent}>
            {data.wishlist ? (
              <ul>
                {data.wishlist.split(",").map((item, index) => (
                  <li key={index}>{item.trim()}</li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptyText}>No items listed.</p>
            )}
          </div>
        </aside>

        <main className={styles.dashboardMain}>
          {selectedJobId ? (
            /* --- SECTION: APPLICANTS VIEW --- */
            <section className={styles.glassSection}>
              <div className={styles.sectionHeader}>
                <button className={styles.backBtn} onClick={() => setSelectedJobId(null)}>
                  ← Back to Dashboard
                </button>
                <h2 className={styles.sectionTitle}>Applicants for Job</h2>
              </div>
              <div className={styles.applicantGrid}>
                {applicants.length > 0 ? (
                  applicants.map((app) => (
                    <div key={app._id} className={styles.applicantCard}>
                      <div className={styles.applicantHeader}>
                        <h4>{app.userName}</h4>
                        <span className={styles.statusBadge}>{app.status}</span>
                      </div>
                      <p><strong>Exp:</strong> {app.experience} Years</p>
                      <p className={styles.whyMe}>"{app.whyMe}"</p>
                      <div className={styles.btnGroup}>
                        {app.status === "Pending" && (
                          <>
                            <button className={styles.acceptBtn} onClick={() => handleAcceptApplication(app)}>Accept</button>
                            <button className={styles.rejectBtn} onClick={() => handleRejectApplication(app)}>Reject</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={styles.emptyText}>No one has applied yet.</p>
                )}
              </div>
            </section>
          ) : (
            <>
              {/* --- SECTION 1: STATS GRID --- */}
              <section className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <h3>Active Fundraisers</h3>
                  <div className={styles.statValue}>{data.ongoing_fund?.length || 0}</div>
                </div>
                {data.stats?.map((stat, index) => (
                  <div className={styles.statCard} key={index}>
                    <h3>{stat.title}</h3>
                    <div className={styles.statValue}>{stat.value}</div>
                  </div>
                ))}
              </section>

              {/* --- SECTION 2: OPEN POSITIONS --- */}
              <section className={styles.glassSection}>
                <h2 className={styles.sectionTitle}>💼 Open Positions</h2>
                <div className={styles.cardGrid}>
                  {jobs.length > 0 ? (
                    jobs.map((job) => (
                      <div key={job._id} className={styles.jobPortalCard}>
                        <h3>{job.title}</h3>
                        <div className={styles.jobMeta}>
                          <span>{job.type}</span> | <span>₹{job.pay}</span>
                        </div>
                        <div className={styles.btnGroup}>
                          <button className={styles.acceptBtn} onClick={() => handleViewApplicants(job._id)}>View Applicants</button>
                          <button className={styles.rejectBtn}>Delete Listing</button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={styles.emptyText}>You haven't posted any jobs yet.</p>
                  )}
                </div>
              </section>

              {/* --- SECTION 3: ACTIVE FUNDRAISERS --- */}
              <section className={styles.glassSection}>
                <h2 className={styles.sectionTitle}>Active Fundraisers</h2>
                <div className={styles.cardGrid}>
                  {data.ongoing_fund?.map((fund, index) => (
                    <div className={styles.fundraiserCard} key={index}>
                      <h3>{fund.fundraiser_name}</h3>
                      <div className={styles.fundInfo}>
                        <span>Raised: ₹{fund.amount_raised_so_far}</span>
                        <span> Goal: ₹{fund.goal_amount}</span>
                      </div>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${(fund.amount_raised_so_far / fund.goal_amount) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* --- SECTION 4: IMPACT STORIES UPLOAD --- */}
              <section className={styles.glassSection}>
                <h2 className={styles.sectionTitle}>Share Impact Stories</h2>
                <div className={styles.storyForm}>
                  <input
                    type="text"
                    placeholder="Story Title"
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                  />
                  <textarea
                    placeholder="Describe the impact..."
                    value={storyDescription}
                    onChange={(e) => setStoryDescription(e.target.value)}
                  />
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => setStoryFiles([...e.target.files])}
                  />
                  <button onClick={handleUploadStory}>Upload Story</button>
                </div>
              </section>

              {/* --- SECTION 5: PENDING ITEM REQUESTS (NEW CLICKABLE FORMAT) --- */}
              <section className={styles.glassSection}>
                <h2 className={styles.sectionTitle}>Pending Item Requests</h2>
                <div className={styles.messageList}>
                  {data.messages?.length > 0 ? (
                    data.messages.map((msg, index) => (
                      <div 
                        className={styles.clickableRequestRow} 
                        key={index}
                        onClick={() => setSelectedMsg(msg)}
                      >
                        <div className={styles.msgHeader}>
                          <strong>{msg.category}</strong> - {msg.location}
                        </div>
                        <span className={styles.expandText}>Click to view details</span>
                      </div>
                    ))
                  ) : (
                    <p className={styles.emptyText}>No pending requests.</p>
                  )}
                </div>
              </section>

              {/* --- SECTION 5: MONEY DONATIONS --- */}
              <section className={styles.glassSection}>
                <h2 className={styles.sectionTitle}>💰 Recent Money Donations</h2>
                <div className={styles.messageList}>
                  {data.recentDonations?.length > 0 ? (
                    data.recentDonations.map((don, index) => (
                      <div className={styles.messageItem} key={index}>
                        <div className={styles.msgDetails}>
                          <strong>{don.donor_name}: ₹{don.amount}</strong>
                          <p>Received: {don.donated_at ? new Date(don.donated_at).toLocaleDateString() : "Recently"}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={styles.emptyText}>No money donations yet.</p>
                  )}
                </div>
              </section>
            </>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default CarehomeDashboard;