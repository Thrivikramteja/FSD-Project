import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CareHeader from '../components/CareHeader';
import Footer from '../components/footer';
import styles from '../styles/CarehomeDashboard.module.css'; 

const CarehomeDashboard = () => {
    const { careid } = useParams(); 
    const [data, setData] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);   // NEW

    const fetchData = async () => {
        try {
            const dashRes = await fetch(`http://localhost:3000/api/carehome-dashboard/${careid}`, { credentials: 'include' });
            const jobsRes = await fetch(`http://localhost:3000/api/carehome/my-jobs`, { credentials: 'include' });

            if (!dashRes.ok) {
                const errData = await dashRes.json();
                throw new Error(errData.message || "Failed to load dashboard");
            }

            if (!jobsRes.ok) {
                const errData = await jobsRes.json();
                throw new Error(errData.message || "Failed to load jobs");
            }

            const dashResult = await dashRes.json();
            const jobsResult = await jobsRes.json();

            setData(dashResult);
            setJobs(jobsResult.jobs || []);
        } catch (err) {
            console.error("Error fetching dashboard data:", err);

            setError(err.message || "Failed to load dashboard");
            
            // Redirect after 5 seconds
            setTimeout(() => {
                window.location.href = "/error";
            }, 5000);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [careid]);

    const handleViewApplicants = async (jobId) => {
        try {
            const response = await fetch(`http://localhost:3000/api/carehome/jobs/${jobId}/applicants`, { credentials: 'include' });
            const result = await response.json();
            if (result.success) {
                setApplicants(result.applicants);
                setSelectedJobId(jobId);
            }
        } catch (error) {
            console.error("Error fetching applicants:", error);
        }
    };

    const handleItemAction = async (msg, action) => {
        try {
            const response = await fetch('http://localhost:3000/donate_item/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    action: action,
                    carehomeId: careid,
                    userId: msg.userId,
                    category: msg.category,
                    delivery_date: msg.delivery_date,
                    location: msg.location,
                    description: msg.description
                }),
            });
            if (response.ok) {
                alert(`Request ${action === 'accept' ? 'approved' : 'declined'} successfully`);
                fetchData(); 
            }
        } catch (error) {
            console.error("Error processing item action:", error);
        }
    };

    if (loading) return <div className={styles.loader}>Loading Premium Dashboard...</div>;

    if (error) {
        return (
            <div className={styles.error}>
                Error: {error}
            </div>
        );
    }

    if (!data) return <div className={styles.error}>No dashboard data found.</div>;

    return (
        <div className={styles.pageWrapper}>
            <CareHeader careid={careid} />

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
                                {data.wishlist.split(',').map((item, index) => (
                                    <li key={index}>{item.trim()}</li>
                                ))}
                            </ul>
                        ) : <p className={styles.emptyText}>No items listed.</p>}
                    </div>
                </aside>

                <main className={styles.dashboardMain}>
                    
                    {selectedJobId ? (
                        <section className={styles.glassSection}>
                            <div className={styles.sectionHeader}>
                                <button className={styles.backBtn} onClick={() => setSelectedJobId(null)}>← Back to Dashboard</button>
                                <h2 className={styles.sectionTitle}>Applicants for Job</h2>
                            </div>
                            <div className={styles.applicantGrid}>
                                {applicants.length > 0 ? applicants.map((app) => (
                                    <div key={app._id} className={styles.applicantCard}>
                                        <div className={styles.applicantHeader}>
                                            <h4>{app.userName}</h4>
                                            <span className={styles.statusBadge}>{app.status}</span>
                                        </div>
                                        <p><strong>Exp:</strong> {app.experience} Years</p>
                                        <p className={styles.whyMe}>"{app.whyMe}"</p>
                                        <div className={styles.btnGroup}>
                                            <button className={styles.acceptBtn}>Accept</button>
                                            <button className={styles.rejectBtn}>Reject</button>
                                        </div>
                                    </div>
                                )) : <p className={styles.emptyText}>No one has applied for this job yet.</p>}
                            </div>
                        </section>
                    ) : (
                        <>
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

                            <section className={styles.glassSection}>
                                <h2 className={styles.sectionTitle}>
                                    <span className={styles.icon}>💼</span> Open Positions
                                </h2>
                                <div className={styles.cardGrid}>
                                    {jobs.length > 0 ? jobs.map((job) => (
                                        <div key={job._id} className={styles.jobPortalCard}>
                                            <h3>{job.title}</h3>
                                            <div className={styles.jobMeta}>
                                                <span>{job.type}</span> | <span>₹{job.pay}</span>
                                            </div>
                                            <div className={styles.btnGroup}>
                                                <button 
                                                    className={styles.acceptBtn} 
                                                    onClick={() => handleViewApplicants(job._id)}
                                                >
                                                    View Applicants
                                                </button>
                                                <button className={styles.rejectBtn}>Delete Listing</button>
                                            </div>
                                        </div>
                                    )) : <p className={styles.emptyText}>You haven't posted any jobs yet.</p>}
                                </div>
                            </section>

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
                                                <div className={styles.progressFill} style={{ width: `${(fund.amount_raised_so_far / fund.goal_amount) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className={styles.glassSection}>
                                <h2 className={styles.sectionTitle}>Pending Item Requests</h2>
                                <div className={styles.messageList}>
                                    {data.messages?.length > 0 ? data.messages.map((msg, index) => (
                                        <div className={styles.messageItem} key={index}>
                                            <div className={styles.msgDetails}>
                                                <strong>{msg.category}</strong> - {msg.location}
                                                <p>{msg.description}</p>
                                            </div>
                                            <div className={styles.btnGroupSmall}>
                                                <button className={styles.acceptBtn} onClick={() => handleItemAction(msg, 'accept')}>Approve</button>
                                                <button className={styles.rejectBtn} onClick={() => handleItemAction(msg, 'reject')}>Decline</button>
                                            </div>
                                        </div>
                                    )) : <p className={styles.emptyText}>No pending requests.</p>}
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