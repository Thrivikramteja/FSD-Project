import React, { useState, useEffect } from 'react';
import styles from '../styles/AdminEvents.module.css';

const AdminEvents = () => {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("completed");

    // Audit States
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [auditLoading, setAuditLoading] = useState(false);

    useEffect(() => {
        
        fetch(`https://fsd-project-backend-2bms.onrender.com/api/admin/events-analytics`, { credentials: 'include' })
            .then(res => res.ok ? res.json() : Promise.reject(`Error: ${res.status}`))
            .then(json => setData(json))
            .catch(err => { 
                console.error("Fetch Error:", err); 
                setError(err.message); 
            });
    }, []);


    const handleAudit = async (event) => {
        setSelectedEvent(event);
        setAuditLoading(true);
        try {
            
            const res = await fetch(`https://fsd-project-backend-2bms.onrender.com/api/admin/event-registrations/${event._id}`, { 
                credentials: 'include' 
            });
            const json = await res.json();
            setParticipants(json.registrationList || []);
        } catch (err) {
            console.error("Audit failed:", err);
        } finally {
            setAuditLoading(false);
        }
    };

    if (error) return <div className={styles.loader} style={{color: 'red'}}>Error: {error}</div>;
    if (!data) return <div className={styles.loader}>Accessing Database...</div>;

    const filteredList = data.groups?.[activeTab]?.filter(e => 
        e.event_name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className={styles.adminPage}>
            
            <div className={styles.ribbon}>
                <div className={styles.kpiCard}>
                    <span>Most Influential NGO</span>
                    <h3>{data.analytics?.influentialNgo?.name || 'N/A'}</h3>
                    <p>{data.analytics?.influentialNgo?.impact || 0} Total Registered Attendees</p>
                </div>
                <div className={styles.kpiCard}>
                    <span>Highest Influential Event</span>
                    <h3>{data.analytics?.influentialEvent?.event_name || 'N/A'}</h3>
                    <p>{data.analytics?.influentialEvent?.number_of_registrations || 0} Attendees</p>
                </div>
            </div>

            
            <div className={styles.chartContainer}>
                <h4>Attendance Velocity (Completed Events)</h4>
                <div className={styles.chartArea}>
                    {data.groups?.completed?.slice(0, 12).map((e, i) => {
                        const maxRegs = Math.max(...data.groups.completed.map(ev => ev.number_of_registrations || 0));
                        const height = maxRegs > 0 ? (e.number_of_registrations / maxRegs) * 100 : 0;
                        return (
                            <div key={i} className={styles.barWrapper}>
                                <div className={styles.bar} style={{ height: `${height}%` }}>
                                    <span className={styles.popover}>{e.number_of_registrations}</span>
                                </div>
                                <small>{e.event_name?.slice(0, 6) || 'N/A'}..</small>
                            </div>
                        );
                    })}
                </div>
            </div>

           
            <div className={styles.tableSection}>
                <div className={styles.tableHeader}>
                    <div className={styles.tabButtons}>
                        {['ongoing', 'upcoming', 'completed'].map(t => (
                            <button 
                                key={t} 
                                className={activeTab === t ? styles.activeTab : ""} 
                                onClick={() => setActiveTab(t)}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search records..." 
                        className={styles.searchBox} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                </div>

                <table className={styles.dataTable}>
                    <thead>
                        <tr><th>Event Name</th><th>Date</th><th>Registrations</th><th>Location</th></tr>
                    </thead>
                    <tbody>
                        {filteredList.map(e => (
                            <tr key={e._id} onClick={() => handleAudit(e)} className={styles.clickableRow}>
                                <td><strong>{e.event_name || 'N/A'}</strong></td>
                                <td>{e.event_date ? new Date(e.event_date).toLocaleDateString() : 'N/A'}</td>
                                <td>{e.number_of_registrations || 0}</td>
                                <td>{e.event_location || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

           
            {selectedEvent && (
                <div className={styles.modalOverlay} onClick={() => setSelectedEvent(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Participation Audit: {selectedEvent.event_name}</h3>
                            <button onClick={() => setSelectedEvent(null)}>×</button>
                        </div>
                        <div className={styles.modalBody}>
                            {auditLoading ? <p>Loading participants...</p> : (
                                <table className={styles.modalTable}>
                                    <thead>
                                        <tr><th>Participant</th><th>User ID</th><th>Registration Date</th></tr>
                                    </thead>
                                    <tbody>
                                        {participants.length > 0 ? participants.map((p, i) => (
                                            <tr key={i}>
                                                <td className={styles.greenText}>{p.name}</td>
                                                <td>#{p.userId}</td>
                                                <td>{new Date(p.registeredAt).toLocaleDateString()}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="3" style={{textAlign:'center'}}>No participants recorded.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminEvents;