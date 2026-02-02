import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                // Pointing to your exact route defined in admin.routes.js
                const response = await axios.get('http://localhost:3000/api/admin/dashboard', {
                    withCredentials: true // Crucial for authenticate middleware to see the cookie
                });
                setStats(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
                // If 401, they likely aren't logged in as 'Admin'
                setError(err.response?.data?.message || "Failed to load admin data.");
                setLoading(false);
            }
        };

        fetchAdminData();
    }, []);

    if (loading) return <div style={centerStyle}>Loading Admin Dashboard...</div>;
    if (error) return <div style={centerStyle}>Error: {error}</div>;

    return (
        <div className="dashboard-container" style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
            <header className="dashboard-header" style={headerStyle}>
                <h1>Charity Admin Dashboard</h1>
                <div className="header-stats">
                    <span style={{ marginRight: '20px' }}>Last Updated: {new Date().toLocaleDateString()}</span>
                    <Link to="/" style={{ color: 'white', fontWeight: 'bold' }}>Home</Link>
                </div>
            </header>

            {/* Statistics Cards */}
            <div className="stats-grid" style={gridStyle}>
                <StatCard title="Highest Donation" value={`₹${stats.highest_Donation}`} subtext="Anonymous Donor" />
                <StatCard 
                    title="Highest Contributor" 
                    value={stats.high_con_name?.name || "N/A"} 
                    subtext={`Total: ₹${stats.high_con_name?.total_contributed || 0}`} 
                />
                <StatCard title="Total Revenue" value={`₹${stats.total_revenue}`} subtext="All Time" />
                <StatCard title="Total NGOs" value={stats.total_ngo} subtext="Active Partners" />
                <StatCard title="Total Care Homes" value={stats.total_care} subtext="Supported" />
                <StatCard title="Total Money Moved" value={`₹${stats.total_money}`} subtext="Through Platform" />
                <StatCard title="Active Events" value={stats.total_events} subtext="Ongoing" />
            </div>

            {/* Fundraisers Section */}
            <div className="fundraisers-section" style={{ marginTop: '40px' }}>
                <h2 style={{ color: '#2c6e49', marginBottom: '20px' }}>Top Performing Fundraisers</h2>
                <div className="fundraisers-list" style={fundraiserGridStyle}>
                    {stats.top_fund && stats.top_fund.length > 0 ? (
                        stats.top_fund.map((fund, index) => (
                            <div className="fundraiser-card" key={index} style={cardStyle}>
                                <h4 style={{ color: '#2c6e49', marginBottom: '10px' }}>{fund.fundraiser_name}</h4>
                                <p>Raised: <strong>₹{fund.amount_raised_so_far.toLocaleString()}</strong></p>
                                <p>Goal: ₹{fund.goal_amount.toLocaleString()}</p>
                                <div className="progress-bar" style={progressBarStyle}>
                                    <div 
                                        className="progress" 
                                        style={{ 
                                            ...progressFillStyle, 
                                            width: `${(fund.amount_raised_so_far / fund.goal_amount * 100).toFixed(2)}%` 
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No fundraiser data available.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// Simple StatCard Helper Component
const StatCard = ({ title, value, subtext }) => (
    <div className="stat-card" style={cardStyle}>
        <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>{title}</h3>
        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c6e49' }}>{value}</p>
        <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>{subtext}</p>
    </div>
);

// Inline Styles for simplicity
const headerStyle = {
    background: 'linear-gradient(135deg, #2c6e49 0%, #4e9f76 100%)',
    padding: '20px 30px',
    borderRadius: '10px',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
};

const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px'
};

const fundraiserGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px'
};

const cardStyle = {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    borderLeft: '4px solid #66ed4c'
};

const progressBarStyle = {
    background: '#eee',
    height: '10px',
    borderRadius: '5px',
    marginTop: '15px',
    overflow: 'hidden'
};

const progressFillStyle = {
    background: 'linear-gradient(90deg, #2c6e49, #66ed4c)',
    height: '100%',
    transition: 'width 0.5s ease-in-out'
};

const centerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem' };

export default AdminDashboard;