import React, { useState, useEffect } from 'react';
import styles from '../styles/UserControl.module.css';

const NgoControl = () => {
    const [ngos, setNgos] = useState([]);
    const [search, setSearch] = useState("");
    const [auditNgo, setAuditNgo] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [reason, setReason] = useState("");

    useEffect(() => {
        fetch('http://localhost:3000/api/admin/all-ngos-manage', { credentials: 'include' })
            .then(res => res.json()).then(data => setNgos(data.ngos || []));
    }, []);

    const fetchNgoStats = async (ngo) => {
        const res = await fetch(`http://localhost:3000/api/admin/ngo-manage-stats/${ngo.ngoId}`, { credentials: 'include' });
        const json = await res.json();
        setAuditNgo(json.stats);
    };

    const confirmDelete = async () => {
        if (!reason) return alert("Reason required");
        await fetch('http://localhost:3000/api/admin/delete-ngo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ngoId: deleteTarget.ngoId, email: deleteTarget.email, name: deleteTarget.Ngoname, reason }),
            credentials: 'include'
        });
        setNgos(ngos.filter(n => n.ngoId !== deleteTarget.ngoId));
        setDeleteTarget(null);
    };

    const filtered = ngos.filter(n => n.Ngoname?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className={styles.subContainer}>
            <input className={styles.search} placeholder="Search NGOs by name or ID..." onChange={e => setSearch(e.target.value)} />
            
            <table className={styles.userTable}>
                <thead><tr><th>NGO Name</th><th>Darpan ID</th><th>Actions</th></tr></thead>
                <tbody>
                    {filtered.length > 0 ? filtered.map(n => (
                        <tr key={n.ngoId}>
                            <td className={styles.nameLink} onClick={() => fetchNgoStats(n)}>{n.Ngoname}</td>
                            <td>{n.darpan_id}</td>
                            <td><button className={styles.delBtn} onClick={() => setDeleteTarget(n)}>Deactivate</button></td>
                        </tr>
                    )) : <tr><td colSpan="3" align="center">No NGOs as of now.</td></tr>}
                </tbody>
            </table>


            {auditNgo && (
                <div className={styles.overlay} onClick={() => setAuditNgo(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Organization Audit: {auditNgo.Ngoname}</h3>
                            <button onClick={() => setAuditNgo(null)}>×</button>
                        </div>
                        <div className={styles.grid}>
                            <div className={styles.card}><span>Est. Year</span><p>{auditNgo.year_established}</p></div>
                            <div className={styles.card}><span>Darpan ID</span><p>{auditNgo.darpan_id}</p></div>
                            <div className={styles.card}><span>Total Events</span><p>{auditNgo.totalEvents}</p></div>
                            <div className={styles.card}><span>Fundraisers Created</span><p>{auditNgo.totalFundraisers}</p></div>
                            <div className={styles.card}><span>Highest Fundraiser</span><p>₹{auditNgo.highestFunding}</p></div>
                            <div className={styles.card}><span>Max Registrations</span><p>{auditNgo.highestRegistrations}</p></div>
                        </div>
                    </div>
                </div>
            )}

           
            {deleteTarget && (
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        <h3>Deactivate NGO: {deleteTarget.Ngoname}</h3>
                        <textarea className={styles.reasonBox} placeholder="Reason for deactivation..." onChange={e => setReason(e.target.value)} />
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

export default NgoControl;