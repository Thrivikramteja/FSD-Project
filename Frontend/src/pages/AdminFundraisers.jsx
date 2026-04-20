import React, { useState, useEffect } from 'react';
import styles from '../styles/AdminFundraisers.module.css';

const AdminFundraisers = () => {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("ongoing");
    const [selectedFundraiser, setSelectedFundraiser] = useState(null);
    const [donors, setDonors] = useState([]);

    useEffect(() => {
        fetch(`https://fsd-project-backend-2bms.onrender.com/api/admin/fundraisers-analytics`, { credentials: 'include' })
            .then(res => {
                if (!res.ok) throw new Error(`API Error: ${res.status}`);
                return res.json();
            })
            .then(json => {
                if (!json.success && json.success !== undefined) {
                    throw new Error(json.message || 'Failed to load fundraisers');
                }
                setData(json);
            })
            .catch(err => {
                console.error("Error loading fundraisers:", err);
                setError(err.message);
            });
    }, []);

    const handleViewDonors = async (f) => {
        setSelectedFundraiser(f);
        try {
            const res = await fetch(`https://fsd-project-backend-2bms.onrender.com/api/admin/fundraiser-donors/${f._id}`, { credentials: 'include' });
            if (!res.ok) throw new Error(`API Error: ${res.status}`);
            const json = await res.json();
            setDonors(json.donorList || []);
        } catch (err) {
            console.error("Error loading donors:", err);
            alert("Failed to load donors: " + err.message);
        }
    };

    if (error) return <div className={styles.loading} style={{color: 'red'}}>Error: {error}</div>;
    if (!data) return <div className={styles.loading}>Auditing Financials...</div>;

    const filteredList = data.groups?.[activeTab]?.filter(f => 
        f.fundraiser_name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className={styles.adminPage}>
            
            <div className={styles.topGrid}>
                {data.analytics?.top3Ongoing?.map(f => (
                    <div key={f._id} className={styles.topCard}>
                        <h3>{f.fundraiser_name || 'N/A'}</h3>
                        <p>NGO: {f.ngoName || 'N/A'}</p>
                        <div className={styles.amount}>₹{(f.amount_raised_so_far || 0).toLocaleString()}</div>
                    </div>
                )) || <p>No ongoing fundraisers</p>}
            </div>

           
            <div className={styles.chartBox}>
                <h4>Revenue Generation per NGO</h4>
                <div className={styles.barArea}>
                    {data.analytics?.ngoRevenue && data.analytics.ngoRevenue.length > 0 ? (
                        (() => {
                            const maxRevenue = Math.max(...data.analytics.ngoRevenue.map(ngo => ngo.total || 0));
                            
                            return data.analytics.ngoRevenue.map((ngo, i) => {
                                const heightPercent = maxRevenue > 0 ? (ngo.total / maxRevenue) * 100 : 0;
                                
                                return (
                                    <div key={i} className={styles.barGroup}>
                                        <div 
                                            className={styles.bar} 
                                            style={{ 
                                                height: `${heightPercent}%`,
                                                minHeight: heightPercent > 0 ? '5px' : '0px'
                                            }}
                                        >
                                            {ngo.total > 0 && (
                                                <span className={styles.tooltip}>
                                                    ₹{ngo.total.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                        <small>{ngo.name?.substring(0, 10) || 'NGO'}</small>
                                    </div>
                                );
                            });
                        })()
                    ) : (
                        <p>No NGO revenue data</p>
                    )}
                </div>
            </div>

            
            <div className={styles.tableSection}>
                <div className={styles.tableHeader}>
                    <div className={styles.tabs}>
                        <button className={activeTab === 'ongoing' ? styles.active : ""} onClick={() => setActiveTab('ongoing')}>Ongoing</button>
                        <button className={activeTab === 'completed' ? styles.active : ""} onClick={() => setActiveTab('completed')}>Completed</button>
                    </div>
                    <input className={styles.search} placeholder="Search fundraisers..." onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <table className={styles.dataTable}>
                    <thead>
                        <tr><th>Name</th><th>NGO</th><th>Care Home</th><th>Raised</th><th>Audit</th></tr>
                    </thead>
                    <tbody>
                        {filteredList && filteredList.length > 0 ? (
                            filteredList.map(f => (
                                <tr key={f._id}>
                                    <td>{f.fundraiser_name || 'N/A'}</td>
                                    <td>{f.ngoName || 'N/A'}</td>
                                    <td>{f.carehomeName || 'N/A'}</td>
                                    <td className={styles.greenText}>₹{(f.amount_raised_so_far || 0).toLocaleString()}</td>
                                    <td><button className={styles.viewBtn} onClick={() => handleViewDonors(f)}>View Donors</button></td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5">No fundraisers found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            
            {selectedFundraiser && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>Donor Ledger: {selectedFundraiser.fundraiser_name}</h3>
                            <button onClick={() => setSelectedFundraiser(null)}>×</button>
                        </div>
                        <div className={styles.modalBody}>
                            <table className={styles.modalTable}>
                                <thead><tr><th>Name</th><th>Amount</th><th>Date</th></tr></thead>
                                <tbody>
                                    {donors.map((d, i) => (
                                        <tr key={i}><td>{d.name}</td><td>₹{d.amount}</td><td>{new Date(d.date).toLocaleDateString()}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminFundraisers;