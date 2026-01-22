// import React, { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import CareHeader from '../components/CareHeader';
// import Footer from '../components/footer';
// import styles from '../styles/CarehomeDashboard.module.css'; 

// const CarehomeDashboard = () => {
//     const { careid } = useParams(); 
//     const [data, setData] = useState(null);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 const response = await fetch(`http://localhost:3000/api/carehome-dashboard/${careid}`, {
//                     credentials: 'include'
//                 });
//                 if (response.ok) {
//                     const result = await response.json();
//                     setData(result);
//                 }
//             } catch (error) {
//                 console.error("Error fetching dashboard data:", error);
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchData();
//     }, [careid]);

//     if (loading) return <div className={styles.loader}>Loading Premium Dashboard...</div>;
//     if (!data) return <div className={styles.error}>No dashboard data found.</div>;

//     return (
//         <div className={styles.pageWrapper}>
//             <CareHeader careid={careid} />

//             <header className={styles.dashboardHeader}>
//                 <h1 className={styles.mainTitle}>{data.name}</h1>
//                 <p className={styles.subtitle}>Management Console</p>
//             </header>

//             <div className={styles.container}>
//                 {/* --- SIDEBAR: WISHLIST --- */}
//                 <aside className={styles.wishlistSidebar}>
//                     <h2>Wishlist of Needs</h2>
//                     <div className={styles.wishlistContent}>
//                         {data.wishlist ? (
//                             <ul>
//                                 {data.wishlist.split(',').map((item, index) => (
//                                     <li key={index}>{item.trim()}</li>
//                                 ))}
//                             </ul>
//                         ) : (
//                             <p className={styles.emptyText}>No items listed.</p>
//                         )}
//                     </div>
//                 </aside>

//                 {/* --- MAIN CONTENT --- */}
//                 <main className={styles.dashboardMain}>
                    
//                     {/* STATS SECTION */}
//                     <section className={styles.statsGrid}>
//                         <div className={styles.statCard}>
//                             <h3>Active Fundraisers</h3>
//                             <div className={styles.statValue}>{data.ongoing_fund?.length || 0}</div>
//                         </div>
//                         {data.stats?.map((stat, index) => (
//                             <div className={styles.statCard} key={index}>
//                                 <h3>{stat.title}</h3>
//                                 <div className={styles.statValue}>{stat.value}</div>
//                             </div>
//                         ))}
//                     </section>

//                     {/* NEW FEATURE: JOB APPLICANTS SECTION */}
//                     <section className={styles.glassSection}>
//                         <h2 className={styles.sectionTitle}>
//                             <span className={styles.icon}>💼</span> New Job Applicants
//                         </h2>
//                         <div className={styles.applicantGrid}>
//                             {/* This would be mapped from your new application data */}
//                             <div className={styles.applicantCard}>
//                                 <div className={styles.applicantHeader}>
//                                     <h4>Karthik S.</h4>
//                                     <span className={styles.statusBadge}>Pending Review</span>
//                                 </div>
//                                 <p><strong>Exp:</strong> 2 Years</p>
//                                 <p className={styles.whyMe}>"I have a passion for elderly care and local community support..."</p>
//                                 <div className={styles.btnGroup}>
//                                     <button className={styles.acceptBtn}>Accept</button>
//                                     <button className={styles.rejectBtn}>Reject</button>
//                                 </div>
//                             </div>
//                         </div>
//                     </section>

//                     {/* FUNDRAISERS */}
//                     <section className={styles.glassSection}>
//                         <h2 className={styles.sectionTitle}>Active Fundraisers</h2>
//                         <div className={styles.cardGrid}>
//                             {data.ongoing_fund?.map((fund, index) => (
//                                 <div className={styles.fundraiserCard} key={index}>
//                                     <h3>{fund.fundraiser_name}</h3>
//                                     <div className={styles.fundInfo}>
//                                         <span>Raised: ₹{fund.amount_raised_so_far}</span>
//                                         <span>Goal: ₹{fund.goal_amount}</span>
//                                     </div>
//                                     <div className={styles.progressBar}>
//                                         <div 
//                                             className={styles.progressFill} 
//                                             style={{ width: `${(fund.amount_raised_so_far / fund.goal_amount) * 100}%` }}
//                                         ></div>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     </section>

//                     {/* ITEM DONATION DECISIONS */}
//                     <section className={styles.glassSection}>
//                         <h2 className={styles.sectionTitle}>Item Donation Requests</h2>
//                         <div className={styles.messageList}>
//                             {data.messages?.map((msg, index) => (
//                                 <div className={styles.messageItem} key={index}>
//                                     <div className={styles.msgDetails}>
//                                         <strong>{msg.category}</strong> - {msg.location}
//                                         <p>{msg.description}</p>
//                                     </div>
//                                     <div className={styles.btnGroupSmall}>
//                                         <button className={styles.acceptBtn}>Approve</button>
//                                         <button className={styles.rejectBtn}>Decline</button>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     </section>
//                 </main>
//             </div>
//             <Footer />
//         </div>
//     );
// };

// export default CarehomeDashboard;


import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CareHeader from '../components/CareHeader';
import Footer from '../components/footer';
import styles from '../styles/CarehomeDashboard.module.css'; 

const CarehomeDashboard = () => {
    const { careid } = useParams(); 
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/carehome-dashboard/${careid}`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [careid]);

    if (loading) return <div className={styles.loader}>Loading Premium Dashboard...</div>;
    if (!data) return <div className={styles.error}>No dashboard data found.</div>;

    return (
        <div className={styles.pageWrapper}>
            {/* --- NEW CareHeader --- */}
            <CareHeader careid={careid} />

            <header className={styles.dashboardHeader}>
                <h1 className={styles.mainTitle}>{data.name}</h1>
                <p className={styles.subtitle}>Management Console</p>
            </header>

            <div className={styles.container}>
                {/* --- SIDEBAR: WISHLIST --- */}
                <aside className={styles.wishlistSidebar}>
                    <h2>Wishlist of Needs</h2>
                    <div className={styles.wishlistContent}>
                        {data.wishlist ? (
                            <ul>
                                {data.wishlist.split(',').map((item, index) => (
                                    <li key={index}>{item.trim()}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className={styles.emptyText}>No items listed.</p>
                        )}
                    </div>
                </aside>

                {/* --- MAIN CONTENT --- */}
                <main className={styles.dashboardMain}>
                    
                    {/* STATS SECTION */}
                    <section className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <h3>Active Fundraisers</h3>
                            <div className={styles.statValue}>{data.ongoing_fund?.length || 0}</div>
                        </div>
                        {data.stats?.map((stat, index) => (
                            <div className={styles.statCard} key={index}>
                                <h3>{stat.title}</h3>
                                <div className={styles.statValue}>{stat.value}</div>
                            </div>
                        ))}
                    </section>

                    {/* NEW FEATURE: JOB APPLICANTS SECTION */}
                    <section className={styles.glassSection}>
                        <h2 className={styles.sectionTitle}>
                            <span className={styles.icon}>💼</span> New Job Applicants
                        </h2>
                        <div className={styles.applicantGrid}>
                            <div className={styles.applicantCard}>
                                <div className={styles.applicantHeader}>
                                    <h4>Karthik S.</h4>
                                    <span className={styles.statusBadge}>Pending Review</span>
                                </div>
                                <p><strong>Exp:</strong> 2 Years</p>
                                <p className={styles.whyMe}>"I have a passion for elderly care and local community support..."</p>
                                <div className={styles.btnGroup}>
                                    <button className={styles.acceptBtn}>Accept</button>
                                    <button className={styles.rejectBtn}>Reject</button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* FUNDRAISERS */}
                    <section className={styles.glassSection}>
                        <h2 className={styles.sectionTitle}>Active Fundraisers</h2>
                        <div className={styles.cardGrid}>
                            {data.ongoing_fund?.map((fund, index) => (
                                <div className={styles.fundraiserCard} key={index}>
                                    <h3>{fund.fundraiser_name}</h3>
                                    <div className={styles.fundInfo}>
                                        <span>Raised: ₹{fund.amount_raised_so_far}</span>
                                        <span>Goal: ₹{fund.goal_amount}</span>
                                    </div>
                                    <div className={styles.progressBar}>
                                        <div 
                                            className={styles.progressFill} 
                                            style={{ width: `${(fund.amount_raised_so_far / fund.goal_amount) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ITEM DONATION DECISIONS */}
                    <section className={styles.glassSection}>
                        <h2 className={styles.sectionTitle}>Item Donation Requests</h2>
                        <div className={styles.messageList}>
                            {data.messages?.map((msg, index) => (
                                <div className={styles.messageItem} key={index}>
                                    <div className={styles.msgDetails}>
                                        <strong>{msg.category}</strong> - {msg.location}
                                        <p>{msg.description}</p>
                                    </div>
                                    <div className={styles.btnGroupSmall}>
                                        <button className={styles.acceptBtn}>Approve</button>
                                        <button className={styles.rejectBtn}>Decline</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default CarehomeDashboard;
