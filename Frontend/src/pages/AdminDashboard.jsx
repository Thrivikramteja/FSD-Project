import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminEvents from './AdminEvents';
import AdminFundraisers from './AdminFundraisers';
import AdminDonations from './AdminDonations';
import UserControlHub from './UserControlHub';
import styles from '../styles/AdminDashboard.module.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); 
    const navigate = useNavigate();
    
    useEffect(() => {
        fetch(`https://fsd-project-backend-2bms.onrender.com/api/admin/main-stats`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error('Error loading stats:', err));
    }, []);

    if (!stats) return <div className={styles.loading}>Initializing Command Center...</div>;

    return (
        <div className={styles.adminWrapper}>
            {/* Massive Header section */}
            <div className={styles.heroHeader}>
                <div className={styles.headerContent}>
                    <div className={styles.topHeaderRow}>
                        <div className={styles.welcomeText}>
                            <h1>Hi, Admin.</h1>
                            <p>System Oversight & Platform Revenue Analytics</p>
                        </div>
                        {/* Pushed to the far right */}
                        <button className={styles.homeBtn} onClick={() => navigate('/')}>
                            Go to Home
                        </button>
                    </div>
                </div>
                
                {/* Options Navigation */}
                <div className={styles.navBar}>
                    <button className={activeTab === 'overview' ? styles.active : ''} onClick={() => setActiveTab('overview')}>Business Overview</button>
                    <button className={activeTab === 'events' ? styles.active : ''} onClick={() => setActiveTab('events')}>Events</button>
                    <button className={activeTab === 'fundraisers' ? styles.active : ''} onClick={() => setActiveTab('fundraisers')}>Fundraisers</button>
                    <button className={activeTab === 'donations' ? styles.active : ''} onClick={() => setActiveTab('donations')}>Direct Donations</button>
                    <button className={activeTab === 'users' ? styles.active : ''} onClick={() => setActiveTab('users')}>Manage Users</button>
                </div>
            </div>

            {/* Dynamic Content Area */}
            <div className={styles.mainStage}>
                {activeTab === 'overview' && (
                    <div className={styles.overviewGrid}>
                        <div className={styles.kpiRibbon}>
                            <div className={styles.kpiCard}>
                                <span>Total Platform Revenue (8%)</span>
                                <h2>₹{stats.total_revenue?.toLocaleString() || '0'}</h2>
                            </div>
                            <div className={styles.kpiCard}>
                                <span>Active NGOs</span>
                                <h2>{stats.total_ngo || '0'}</h2>
                            </div>
                            <div className={styles.kpiCard}>
                                <span>Total Events</span>
                                <h2>{stats.total_events || '0'}</h2>
                            </div>
                            <div className={styles.kpiCard}>
                                <span>Top Donor</span>
                                <h2>{stats.high_con_name?.name || 'N/A'}</h2>
                            </div>
                        </div>

                        <div className={styles.chartSection}>
                            <h3>Monthly Platform Commission (8% Tax)</h3>
                            <div className={styles.revenueGraph}>
                                {stats.monthlyBusiness?.map((m, i) => {
                                    const maxProfit = Math.max(...stats.monthlyBusiness.map(x => x.profit || 0));
                                    const height = maxProfit > 0 ? (m.profit / maxProfit) * 100 : 0;
                                    return (
                                        <div key={i} className={styles.graphBarWrapper}>
                                            <div className={styles.graphBar} style={{ height: `${height}%` }}>
                                                <span className={styles.barLabel}>₹{Number(m.profit).toLocaleString()}</span>
                                            </div>
                                            <small>{m.name}</small>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className={styles.topTable}>
                            <h3>Top 3 Live Fundraisers</h3>
                            <table>
                                <thead>
                                    <tr><th>Name</th><th>Raised</th><th>Goal</th></tr>
                                </thead>
                                <tbody>
                                    {stats.top_fund && stats.top_fund.length > 0 ? (
                                        stats.top_fund.map((f) => (
                                            <tr key={f._id}>
                                                <td>{f.fundraiser_name}</td>
                                                <td>₹{f.amount_raised_so_far?.toLocaleString()}</td>
                                                <td>₹{f.goal_amount?.toLocaleString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>No live fundraisers as of now.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'events' && <AdminEvents />}
                {activeTab === 'fundraisers' && <AdminFundraisers />}
                {activeTab === 'donations' && <AdminDonations />}
                {activeTab === 'users' && <UserControlHub />} 
            </div>
        </div>
    );
};

export default AdminDashboard;