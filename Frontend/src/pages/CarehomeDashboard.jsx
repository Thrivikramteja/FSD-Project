import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CareHeader from '../components/CareHeader';
import Footer from '../components/footer';
import styles from '../styles/CarehomeDashboard.module.css'; 

const CarehomeDashboard = () => {
    const { careid } = useParams(); 
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/carehome-dashboard/${careid}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const result = await response.json();
                setData(result);
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
                const result = await response.json();
                if (result.success) {
                    alert(`Request ${action === 'accept' ? 'approved' : 'declined'} successfully`);
                    fetchData(); 
                }
            } else {
                console.log(response);
                alert("Failed to process request");
            }
        } catch (error) {
            console.error("Error processing item action:", error);
            alert("Network error occurred");
        }
    };

    if (loading) return <div className={styles.loader}>Loading Premium Dashboard...</div>;
    if (!data) return <div className={styles.error}>No dashboard data found.</div>;

    return (
        <div className={styles.pageWrapper}>
            <CareHeader careid={careid} />

            <header className={styles.dashboardHeader}>
                <h1 className={styles.mainTitle}>{data.name}</h1>
                <p className={styles.subtitle}>Management Console</p>
            </header>

            <div className={styles.container}>
                {/* --- SIDEBAR: WISHLIST --- */}
                <aside className={styles.wishlistSidebar}>
                    <h2>Wishlist of Needs</h2>
                    <div className={styles.wishlistContent}>
                        {data.wishlist ? (
                            <ul>
                                {data.wishlist.split(',').map((item, index) => (
                                    <li key={index}>{item.trim()}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className={styles.emptyText}>No items listed.</p>
                        )}
                    </div>
                </aside>

                {/* --- MAIN CONTENT --- */}
                <main className={styles.dashboardMain}>
                    
                    {/* STATS SECTION */}
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

                    {/* JOB APPLICANTS SECTION */}
                    <section className={styles.glassSection}>
                        <h2 className={styles.sectionTitle}>
                            <span className={styles.icon}>💼</span> New Job Applicants
                        </h2>
                        <div className={styles.applicantGrid}>
                            <div className={styles.applicantCard}>
                                <div className={styles.applicantHeader}>
                                    <h4>Karthik S.</h4>
                                    <span className={styles.statusBadge}>Pending Review</span>
                                </div>
                                <p><strong>Exp:</strong> 2 Years</p>
                                <p className={styles.whyMe}>"I have a passion for elderly care and local community support..."</p>
                                <div className={styles.btnGroup}>
                                    <button className={styles.acceptBtn}>Accept</button>
                                    <button className={styles.rejectBtn}>Reject</button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* FUNDRAISERS */}
                    <section className={styles.glassSection}>
                        <h2 className={styles.sectionTitle}>Active Fundraisers</h2>
                        <div className={styles.cardGrid}>
                            {data.ongoing_fund?.map((fund, index) => (
                                <div className={styles.fundraiserCard} key={index}>
                                    <h3>{fund.fundraiser_name}</h3>
                                    <div className={styles.fundInfo}>
                                        <span>Raised: ₹{fund.amount_raised_so_far}</span>
                                        <span>Goal: ₹{fund.goal_amount}</span>
                                    </div>
                                        {fund.amount_raised_so_far >= fund.goal_amount && (
            <div className={styles.goalReachedMessage}>
                <p><strong>Congratulations from the CareConnect Platform!</strong></p>
                <p>You have successfully reached your target. We hope these contributions are used for the greater good of your residents.</p>
            </div>
        )}
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

                    {/* PENDING ITEM DONATION REQUESTS */}
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
                                        <button 
                                            className={styles.acceptBtn} 
                                            onClick={() => handleItemAction(msg, 'accept')}
                                        >
                                            Approve
                                        </button>
                                        <button 
                                            className={styles.rejectBtn} 
                                            onClick={() => handleItemAction(msg, 'reject')}
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            )) : <p className={styles.emptyText}>No pending requests.</p>}
                        </div>
                    </section>

                    {/* --- NEW SECTION: ACCEPTED ITEM DONATIONS --- */}
                    <section className={styles.glassSection}>
                        <h2 className={styles.sectionTitle}>Accepted Item Donations</h2>
                        <div className={styles.messageList}>
                            {data.items?.length > 0 ? data.items.map((item, index) => (
                                <div className={styles.messageItem} key={index}>
                                    <div className={styles.msgDetails}>
                                        <strong>{item.category}</strong>
                                        <p>{item.description || "No description provided"}</p>
                                        <div className={styles.metaData}>
                                            <span>Location: {item.location}</span> | 
                                            <span>  Delivery: {new Date(item.delivery).toDateString()}</span>
                                        </div>
                                    </div>
                                    <div className={styles.statusTag}>Approved</div>
                                </div>
                            )) : <p className={styles.emptyText}>No items accepted yet.</p>}
                        </div>
                    </section>

                </main>
            </div>
            <Footer />
        </div>
    );
};

export default CarehomeDashboard;