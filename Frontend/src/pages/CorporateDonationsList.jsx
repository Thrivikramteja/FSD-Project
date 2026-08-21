import { apiFetch } from "../services/api";
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from "../components/Ngoheader";
import Footer from "../components/footer";
import styles from '../styles/CorporateList.module.css';

const CorporateDonationsList = () => {
    const { ngoID } = useParams();
    const navigate = useNavigate();
    const [donations, setDonations] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDonations = async () => {
            try {
                // Reusing your existing dashboard endpoint logic
                const response = await apiFetch(`/api/ngo-dashboard/${ngoID}`, {
                    credentials: "include"
                });
                const result = await response.json();
                setDonations(result.corporate || []); // Using the key from your controller
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchDonations();
    }, [ngoID]);

    const filtered = donations.filter(d => 
        d.companyName.toLowerCase().includes(search.toLowerCase()) ||
        d.email.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className={styles.loader}>Loading Records...</div>;

    return (
        <div className={styles.pageWrapper}>
            <Header ngoID={ngoID} />
            <main className={styles.container}>
                <div className={styles.headerRow}>
                    <h1>🏢 Corporate Partnerships</h1>
                    <button onClick={() => navigate(-1)} className={styles.backBtn}>← Back to Dashboard</button>
                </div>

                <div className={styles.controls}>
                    <input 
                        type="text" 
                        placeholder="Search by company or email..." 
                        className={styles.searchBar}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className={styles.totalBadge}>Total Grants: {donations.length}</div>
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.listTable}>
                        <thead>
                            <tr>
                                <th>Company Name</th>
                                <th>Email</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Purpose</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length > 0 ? filtered.map(d => (
                                <tr key={d._id}>
                                    <td className={styles.bold}>{d.companyName}</td>
                                    <td>{d.email}</td>
                                    <td className={styles.amount}>₹{d.amount.toLocaleString('en-IN')}</td>
                                    <td>{new Date(d.donatedAt).toLocaleDateString()}</td>
                                    <td className={styles.purpose}>{d.purpose || "General Support"}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="5" className={styles.noData}>No records found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CorporateDonationsList;