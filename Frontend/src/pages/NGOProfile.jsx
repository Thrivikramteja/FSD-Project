import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/header';
import Footer from '../components/footer';
import { headerConfig } from "../config/headerConfig";
import styles from '../styles/NGOProfile.module.css';

const NGOProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNGOFullDetails = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/NGOs/profile/${id}`);
                if (!response.ok) throw new Error("Failed to fetch NGO profile");
                
                const result = await response.json();
                setData(result.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setTimeout(() => navigate('/error'), 2000);
            }
        };
        fetchNGOFullDetails();
    }, [id, navigate]);

    if (loading) return <div className={styles.loader}>Loading Profile...</div>;

    const { ngo, activeFundraisers, pastFundraisers, upcomingEvents, pastEvents } = data;

    return (
        <div className={styles.ngoWrapper}>
            <Header navItems={headerConfig.landing} />
            <main className={styles.container}>
                <section className={styles.profileHeader}>
                    <div className={styles.idCard}>
                        <div className={styles.avatar}>{ngo.Ngoname.charAt(0)}</div>
                        <div className={styles.mainInfo}>
                            <h1>{ngo.Ngoname} <span className={styles.verifyBadge}>✓ Verified</span></h1>
                            <p className={styles.darpanId}>Darpan ID: {ngo.darpan_id || "N/A"}</p>
                        </div>
                    </div>
                    <div className={styles.contactDetails}>
                        <div className={styles.contactItem}><strong>Email:</strong> <span>{ngo.email}</span></div>
                        <div className={styles.contactItem}><strong>Phone:</strong> <span>{ngo.phone}</span></div>
                    </div>
                </section>
                <div className={styles.corporateBox}>
                        <span>Represent a Corporate Entity?</span>
                        <button 
                            className={styles.corporateBtn}
                            onClick={() => navigate(`/corporate-donate/${id}`)}
                        >
                             Corporate Partnership
                        </button>
                    </div>

                <div className={styles.layout}>
                    <div className={styles.activeColumn}>
                        <h2 className={styles.sectionTitle}>Ongoing Fundraisers</h2>
                        {activeFundraisers.length > 0 ? activeFundraisers.map(f => (
                            <div key={f._id} className={styles.actionCard}>
                                <h3>{f.fundraiser_name}</h3>
                                <p className={styles.beneficiary}>Target: {f.carehomeName}</p>
                                <div className={styles.progressLabel}>
                                    <span>₹{f.amount_raised_so_far}</span>
                                    <span>Goal: ₹{f.goal_amount}</span>
                                </div>
                                <div className={styles.progressBase}>
                                    <div className={styles.progressBar} style={{ width: `${(f.amount_raised_so_far/f.goal_amount)*100}%` }}></div>
                                </div>
                                <button className={styles.donateBtn}>Donate Now</button>
                            </div>
                        )) : <p className={styles.empty}>No active fundraisers.</p>}

                        <h2 className={styles.sectionTitle}>Upcoming Events</h2>
                        {upcomingEvents.map(e => (
                            <div key={e._id} className={styles.eventCard}>
                                <div className={styles.dateBox}>
                                    <span className={styles.day}>{new Date(e.event_date).getDate()}</span>
                                    <span className={styles.month}>{new Date(e.event_date).toLocaleString('en-US', {month: 'short'})}</span>
                                </div>
                                <div className={styles.eventText}>
                                    <h4>{e.event_name}</h4>
                                    <p>{e.event_location}</p>
                                </div>
                                <button className={styles.registerBtn}>Register</button>
                            </div>
                        ))}
                    </div>

                    <div className={styles.historyColumn}>
                        <h2 className={styles.sectionTitle}>Impact Logbook</h2>
                        <div className={styles.logGroup}>
                            <p className={styles.logCategory}>Past Successes</p>
                            {pastFundraisers.map(f => (
                                <div key={f._id} className={styles.logStrip}>
                                    <div className={styles.indicator}>✓</div>
                                    <div className={styles.logBody}>
                                        <p className={styles.logTitle}>{f.fundraiser_name}</p>
                                        <p className={styles.logSub}>Beneficiary: {f.carehomeName}</p>
                                    </div>
                                    <div className={styles.logMetric}>
                                        <span>Raised</span>
                                        <strong>₹{f.amount_raised_so_far}</strong>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className={styles.logGroup}>
                            <p className={styles.logCategory}>Completed Events</p>
                            {pastEvents.map(e => (
                                <div key={e._id} className={styles.logStrip}>
                                    <div className={styles.indicator}>🗓</div>
                                    <div className={styles.logBody}>
                                        <p className={styles.logTitle}>{e.event_name}</p>
                                        <p className={styles.logSub}>{new Date(e.event_date).toLocaleDateString()}</p>
                                    </div>
                                    <div className={styles.logMetric}>
                                        <span>Joined</span>
                                        <strong>{e.number_of_registrations || 0}</strong>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default NGOProfile;