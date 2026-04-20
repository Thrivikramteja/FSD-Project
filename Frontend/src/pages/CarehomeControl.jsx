import React, { useState, useEffect } from 'react';
import styles from '../styles/UserControl.module.css';

const CarehomeControl = () => {
    const [homes, setHomes] = useState([]);
    const [search, setSearch] = useState("");
    const [auditHome, setAuditHome] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [reason, setReason] = useState("");

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/all-carehomes-manage`, { credentials: 'include' })
            .then(res => res.json()).then(data => setHomes(data.carehomes || []));
    }, []);

    const fetchHomeStats = async (home) => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/carehome-manage-stats/${home.carehomeId}`, { credentials: 'include' });
        const json = await res.json();
        setAuditHome(json.stats);
    };

    const confirmDelete = async () => {
        if (!reason) return alert("Reason is required.");
        await fetch(
                     `${import.meta.env.VITE_API_URL}/api/admin/delete-carehome?carehomeId=${deleteTarget.carehomeId}&email=${deleteTarget.email}&name=${deleteTarget.care_home_name}&reason=${encodeURIComponent(reason)}`,
                        {
                            method: 'DELETE',
                            credentials: 'include'
                        }
                        );
        setHomes(homes.filter(h => h.carehomeId !== deleteTarget.carehomeId));
        setDeleteTarget(null);
    };

    const filtered = homes.filter(h => h.care_home_name?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className={styles.subContainer}>
            <input className={styles.search} placeholder="Search carehomes..." onChange={e => setSearch(e.target.value)} />
            
            <table className={styles.userTable}>
                <thead><tr><th>Carehome Name</th><th>Reg Number</th><th>Actions</th></tr></thead>
                <tbody>
                    {filtered.map(h => (
                        <tr key={h.carehomeId}>
                            <td className={styles.nameLink} onClick={() => fetchHomeStats(h)}>{h.care_home_name}</td>
                            <td>{h.reg_number}</td>
                            <td><button className={styles.delBtn} onClick={() => setDeleteTarget(h)}>Remove</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            
            {auditHome && (
                <div className={styles.overlay} onClick={() => setAuditHome(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Institution Audit: {auditHome.care_home_name}</h3>
                            <button onClick={() => setAuditHome(null)}>×</button>
                        </div>
                        <div className={styles.grid}>
                            <div className={styles.card}><span>Direct Donations</span><p>₹{auditHome.totalDirectMoney}</p></div>
                            <div className={styles.card}><span>Fundraiser Income</span><p>₹{auditHome.totalFundraiserMoney}</p></div>
                            <div className={styles.card}><span>Active Campaigns</span><p>{auditHome.campaignCount}</p></div>
                            <div className={styles.card}><span>Unique Supporters</span><p>{auditHome.totalSupporters}</p></div>
                            <div className={styles.card}><span>Residents</span><p>{auditHome.num_residents}</p></div>
                            <div className={styles.card}><span>Avg Expense</span><p>₹{auditHome.avg_expense}</p></div>
                        </div>
                    </div>
                </div>
            )}

           
            {deleteTarget && (
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        <h3>De-list Institution: {deleteTarget.care_home_name}</h3>
                        <textarea className={styles.reasonBox} placeholder="Mandatory reason for de-listing..." onChange={e => setReason(e.target.value)} />
                        <div className={styles.btnRow}>
                            <button onClick={() => setDeleteTarget(null)}>Cancel</button>
                            <button className={styles.confirmBtn} onClick={confirmDelete}>Confirm & Notify</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CarehomeControl;