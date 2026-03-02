import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Ngoheader';
import Footer from '../components/footer';
import styles from './details_page.module.css'; 

const DetailsPage = () => {
  const { ngoID, type, id } = useParams(); 
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/NGO-dashboard/${ngoID}/details/${type}/${id}`, {
          method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include'
        });
        const result = await response.json();
        setDetails(result);
        setLoading(false);
      } catch (err) { console.error("Error fetching details:", err); }
    };
    fetchDetails();
  }, [ngoID, type, id]);

  if (loading) return <div className={styles.loader}>Loading...</div>;

  const isFundraiser = type === 'fundraiser';

  return (
    <div className={styles.wrapper}>
      <Header ngoID={ngoID} />
      <main className={styles.container}>
        <button className={styles.btnBack} onClick={() => navigate(-1)}>&larr; Dashboard</button>
        
        {/* --- Main Info Box --- */}
        <section className={styles.mainInfoBox}>
          <div className={styles.bannerHeader}>
            <h1 className={styles.title}>{details.name}</h1>
            <span className={`${styles.badge} ${isFundraiser ? styles.fund : styles.event}`}>
              {type.toUpperCase()}
            </span>
          </div>
          <p className={styles.desc}>{details.description}</p>

          <div className={styles.metricsGrid}>
            <div className={styles.metricItem}>
              <span className={styles.label}>{isFundraiser ? "Total Raised" : "Registrations"}</span>
              <span className={styles.value}>{isFundraiser ? `₹${details.totalRaised}` : details.participantCount}</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.label}>Campaign Status</span>
              <span className={`${styles.value} ${styles.statusText}`}>{details.status}</span>
            </div>
          </div>
        </section>

        {/* --- Table Section --- */}
        <section className={styles.tableArea}>
          <h2 className={styles.subHeading}>{isFundraiser ? "Recent Donations" : "Participant List"}</h2>
          <div className={styles.tableBox}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email Address</th>
                  {isFundraiser && <th>Amount</th>}
                  <th className={styles.center}>Date</th>
                </tr>
              </thead>
              <tbody>
                {details.list?.length > 0 ? details.list.map((item, i) => (
                  <tr key={i}>
                    <td className={styles.bold}>{item.userName}</td>
                    <td>{item.userEmail}</td>
                    {isFundraiser && <td className={styles.currency}>₹{item.amount}</td>}
                    <td className={styles.center}>
                      {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : "N/A"}
                    </td>
                  </tr>
                )) : <tr><td colSpan="4" className={styles.empty}>No activity recorded yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DetailsPage;