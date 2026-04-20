import React, { useState, useEffect } from 'react';
import styles from '../styles/AdminDonations.module.css';

const AdminDonations = () => {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [auditHome, setAuditHome] = useState(null);
    const [donors, setDonors] = useState([]);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/donations-analytics`, { credentials: 'include' })
            .then(res => {
                if (!res.ok) throw new Error(`API Error: ${res.status}`);
                return res.json();
            })
            .then(json => {
                if (!json.success && json.success !== undefined) {
                    throw new Error(json.message || 'Failed to load donations');
                }
                setData(json.analytics || json);
            })
            .catch(err => {
                console.error("Error loading donations:", err);
                setError(err.message);
            });
    }, []);

    const handleAudit = async (home) => {
        setAuditHome(home);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/carehome-donors/${home.carehomeId}`, { credentials: 'include' });
            if (!res.ok) throw new Error(`API Error: ${res.status}`);
            const json = await res.json();
            setDonors(json.donorList || []);
        } catch (err) {
            console.error("Error loading donors:", err);
            alert("Failed to load donors: " + err.message);
        }
    };

    if (error) return <div className={styles.loader} style={{color: 'red'}}>Error: {error}</div>;
    if (!data) return <div className={styles.loader}>Syncing Financial Ledger...</div>;

    return (
        <div className={styles.adminPage}>
            
            <div className={styles.kpiRow}>
                <div className={styles.kpiTile}>
                    <span>Platform Lifetime Direct Giving</span>
                    <h2>₹{data.platformTotal.toLocaleString()}</h2>
                </div>
            </div>

            <div className={styles.visualGrid}>
               
                <div className={styles.chartContainer}>
                    <h4>Carehome Funding Distribution</h4>
                    <div className={styles.barFlow}>
                        {data.carehomeImpact && data.carehomeImpact.length > 0 ? (
                            (() => {
                                const topSix = data.carehomeImpact.slice(0, 6);
                                const maxTotal = Math.max(...topSix.map(home => home.total || 0));
                                
                                return topSix.map((home, i) => {
                                    const heightPercent = maxTotal > 0 ? (home.total / maxTotal) * 100 : 0;
                                    
                                    return (
                                        <div key={i} className={styles.barSet}>
                                            <div 
                                                className={styles.bar} 
                                                style={{ 
                                                    height: `${heightPercent}%`,
                                                    minHeight: heightPercent > 0 ? '5px' : '0px'
                                                }}
                                            >
                                                {home.total > 0 && (
                                                    <span className={styles.val}>₹{home.total.toLocaleString()}</span>
                                                )}
                                            </div>
                                            <p>{home.name ? home.name.split(' ')[0] : 'Carehome'}</p>
                                        </div>
                                    );
                                });
                            })()
                        ) : (
                            <p>No carehome data available</p>
                        )}
                    </div>
                </div>

                
                <div className={styles.chartContainer}>
                    <h4>Monthly Donation Velocity</h4>
                    <div className={styles.trendList}>
                        {data.monthlyStats && data.monthlyStats.length > 0 ? (
                            (() => {
                                const maxMonthly = Math.max(...data.monthlyStats.map(stat => stat.total || 0));
                                
                                return data.monthlyStats.map((stat, i) => {
                                    const widthPercent = maxMonthly > 0 ? (stat.total / maxMonthly) * 100 : 0;
                                    
                                    return (
                                        <div key={i} className={styles.trendRow}>
                                            <span>{stat.name || 'Month'}</span>
                                            <div className={styles.trendTrack}>
                                                <div 
                                                    className={styles.trendFill} 
                                                    style={{ width: `${widthPercent}%` }}
                                                ></div>
                                            </div>
                                            <strong>₹{stat.total.toLocaleString()}</strong>
                                        </div>
                                    );
                                });
                            })()
                        ) : (
                            <p>No monthly data available</p>
                        )}
                    </div>
                </div>
            </div>

            
            <div className={styles.ledgerSection}>
                <table className={styles.ledgerTable}>
                    <thead>
                        <tr><th>Carehome Name</th><th>Direct Funding Received</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                        {data.carehomeImpact && data.carehomeImpact.length > 0 ? (
                            data.carehomeImpact.map((home, i) => (
                                <tr key={i}>
                                    <td>{home.name || 'Unknown'}</td>
                                    <td className={styles.greenBold}>₹{(home.total || 0).toLocaleString()}</td>
                                    <td><button className={styles.auditBtn} onClick={() => handleAudit(home)}>Audit Donors</button></td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="3">No carehome data available</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            
            {auditHome && (
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>Donor Audit: {auditHome.name}</h3>
                            <button onClick={() => setAuditHome(null)}>×</button>
                        </div>
                        <div className={styles.modalBody}>
                            {donors.map((d, i) => (
                                <div key={i} className={styles.donorCard}>
                                    <div className={styles.donorAvatar}>{d.name.charAt(0)}</div>
                                    <div className={styles.donorInfo}>
                                        <p><strong>{d.name}</strong></p>
                                        <small>{new Date(d.date).toLocaleDateString()}</small>
                                    </div>
                                    <div className={styles.donorAmount}>+ ₹{d.amount}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDonations;