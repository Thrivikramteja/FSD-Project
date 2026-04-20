import React, { useState, useEffect } from 'react';
import styles from '../styles/UserControl.module.css';

const DonorControl = () => {
    const [donors, setDonors] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDonor, setSelectedDonor] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/all-donors`, { credentials: 'include' })
            .then(res => res.json()).then(data => setDonors(data.donors || []));
    }, []);

    const handleAudit = async (user) => {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/donor-stats/${user.userId}`, { credentials: 'include' });
        const json = await res.json();
        setSelectedDonor(json.stats);
        setLoading(false);
    };

    const confirmDelete = async () => {
        if (!reason) return alert("Reason is required");
       await fetch(
                `${import.meta.env.VITE_API_URL}/api/admin/delete-donor?userId=${deleteTarget.userId}&email=${deleteTarget.email}&name=${deleteTarget.name}&reason=${encodeURIComponent(reason)}`,
                {
                    method: 'DELETE',
                    credentials: 'include'
                });
        setDonors(donors.filter(d => d.userId !== deleteTarget.userId));
        setDeleteTarget(null);
    };

    const filtered = donors.filter(d => (d.name || "").toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className={styles.subContainer}>
            <div className={styles.searchRow}>
                <input className={styles.search} placeholder="Search donors..." onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <table className={styles.userTable}>
                <thead><tr><th>Name</th><th>Email</th><th>Actions</th></tr></thead>
                <tbody>
                    {filtered.length > 0 ? filtered.map(d => (
                        <tr key={d.userId} className={styles.clickableRow}>
                            <td onClick={() => handleAudit(d)} className={styles.nameLink}>{d.name}</td>
                            <td>{d.email}</td>
                            <td><button className={styles.delBtn} onClick={() => setDeleteTarget(d)}>Delete</button></td>
                        </tr>
                    )) : <tr><td colSpan="3" style={{textAlign:'center', padding:'30px'}}>No donors as of now.</td></tr>}
                </tbody>
            </table>

           
            {selectedDonor && (
                <div className={styles.overlay} onClick={() => setSelectedDonor(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Donor Impact Audit: {selectedDonor.name}</h3>
                            <button onClick={() => setSelectedDonor(null)}>×</button>
                        </div>
                        <div className={styles.grid}>
                            <div className={styles.card}><span>Phone</span><p>{selectedDonor.mobile_number || 'N/A'}</p></div>
                            <div className={styles.card}><span>Highest Donation</span><p>₹{selectedDonor.highestDonation}</p></div>
                            <div className={styles.card}><span>Total Platform Impact</span><p>₹{selectedDonor.totalImpact}</p></div>
                            <div className={styles.card}><span>Events Registered</span><p>{selectedDonor.eventCount}</p></div>
                            <div className={styles.card}><span>Direct Donations</span><p>{selectedDonor.directCount}</p></div>
                            <div className={styles.card}><span>Fundraiser Contributions</span><p>{selectedDonor.fundraiserCount}</p></div>
                        </div>
                    </div>
                </div>
            )}

           
            {deleteTarget && (
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        <h3>Confirm Deletion: {deleteTarget.name}</h3>
                        <p>Explain why this account is being removed. Email notification is automatic.</p>
                        <textarea className={styles.reasonBox} placeholder="Enter reason..." onChange={e => setReason(e.target.value)} />
                        <div className={styles.btnRow}>
                            <button onClick={() => setDeleteTarget(null)}>Cancel</button>
                            <button className={styles.confirmBtn} onClick={confirmDelete}>Confirm & Send Mail</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DonorControl;