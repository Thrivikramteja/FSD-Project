import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/carehome_dashboard.css'; 

// Import Header
import CareHeader from '../components/CareHeader';
import Footer from '../components/footer';


const WishlistSidebar = ({ wishlist }) => {
  let items = [];
  if (Array.isArray(wishlist)) {
    items = wishlist;
  } else if (typeof wishlist === 'string' && wishlist.trim() !== '') {
    items = wishlist.split(',').map(item => item.trim());
  }

  return (
    <aside className="wishlist">
      <h2>Wishlist of Needs</h2>
      <ul>
        {items.length > 0 ? (
          items.map((item, index) => <li key={index}>{item}</li>)
        ) : (
          <li>No items in wishlist. Please go to the edit page to update.</li>
        )}
      </ul>
    </aside>
  );
};

// ==========================================
// SUB-COMPONENT 2: Stats Section (With Toggle)
// ==========================================
const CareStats = ({ stats, activeFundraisers }) => {
  const [showStats, setShowStats] = useState(false);

  return (
    <>
      <button 
        className="btn toggle-btn" 
        onClick={() => setShowStats(!showStats)}
      >
        {showStats ? "Hide Dashboard Stats" : "Show Dashboard Stats"}
      </button>

      {showStats && (
        <section className="dashboard-stats" id="dashboard-stats" style={{ display: 'block' }}>
          <div className="stats-row">
            <div className="stat-card">
              <h3>Active Fundraisers</h3>
              <p className="stat-value">{activeFundraisers}</p>
            </div>
            {stats && stats.map((stat, index) => (
              <div className="stat-card" key={index}>
                <h3>{stat.title}</h3>
                <p className="stat-value">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
};

// ==========================================
// SUB-COMPONENT 3: Fundraisers (View More/Less)
// ==========================================
const FundraiserList = ({ fundraisers }) => {
  const [showAll, setShowAll] = useState(false);
  
  // Show only 1 if collapsed, all if expanded
  const visibleFundraisers = showAll ? fundraisers : fundraisers.slice(0, 1);

  return (
    <section className="fundraisers">
      <h2>Current Associated Fundraisers</h2>
      <div className="fundraiser-list">
        {fundraisers.length > 0 ? (
          visibleFundraisers.map((fundraiser, index) => (
            <div className="fundraiser-card" key={index}>
              <h3>{fundraiser.fundraiser_name}</h3>
              <p>Raised: ₹{fundraiser.amount_raised_so_far} / ₹{fundraiser.goal_amount}</p>
              <div className="progress-bar">
                <div 
                  className="progress" 
                  style={{ width: `${(fundraiser.amount_raised_so_far / fundraiser.goal_amount) * 100}%` }}
                ></div>
              </div>
            </div>
          ))
        ) : (
          <p>No active fundraisers.</p>
        )}
      </div>

      {fundraisers.length > 1 && (
        <div className="button-container">
          <button className="btn" onClick={() => setShowAll(!showAll)}>
            {showAll ? "View Less" : "View More"}
          </button>
        </div>
      )}
    </section>
  );
};

// ==========================================
// SUB-COMPONENT 4: Item Decisions (Accept/Reject)
// ==========================================
const DonationDecisions = ({ messages }) => {
  
  const handleDecision = async (messageId, action, e) => {
    e.preventDefault(); // Prevent form reload
    // In the future, you will fetch() your backend here
    console.log(`Sending decision: ${action} for message ${messageId}`);
    alert(`You clicked ${action}. (Backend logic needed)`);
  };

  return (
    <section className="message-section">
      <h2>Decide Item Donations</h2>
      <div className="message-list">
        {messages && messages.length > 0 ? (
          messages.map((msg, index) => (
            <div className="message-item" key={index}>
              <p><strong>Category:</strong> {msg.category}</p>
              <p><strong>Location:</strong> {msg.location}</p>
              <p><strong>Delivery Date:</strong> {new Date(msg.delivery_date).toLocaleDateString()}</p>
              <p><strong>Description:</strong> {msg.description}</p>
              
              <div className="button-group">
                <button 
                  className="btn accept" 
                  onClick={(e) => handleDecision(msg._id, 'accept', e)}
                >
                  Accept
                </button>
                <button 
                  className="btn reject" 
                  onClick={(e) => handleDecision(msg._id, 'reject', e)}
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No recent item messages available.</p>
        )}
      </div>
    </section>
  );
};

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
const CarehomeDashboard = () => {
  const { careid } = useParams(); 
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // You need to update your backend to return JSON for this route!
        const response = await fetch(`http://localhost:3000/api/carehome-dashboard/${careid}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
            console.error("Failed to fetch data");
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [careid]);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data found.</div>;

  return (
    <div className="carehome-dashboard-page">
      <CareHeader careid={careid} />

      <h1>{data.name}</h1>

      <div className="container">
        
        {/* 1. Sidebar */}
        <WishlistSidebar wishlist={data.wishlist} />

        {/* 2. Main Content */}
        <main className="dashboard">
          <h1>{data.name}</h1>

          {/* Stats */}
          <CareStats 
            stats={data.stats} 
            activeFundraisers={data.ongoing_fund ? data.ongoing_fund.length : 0} 
          />

          {/* Fundraisers */}
          <FundraiserList fundraisers={data.ongoing_fund || []} />

          {/* Recent Donations (Simple list, no separate component needed) */}
          <section className="donations-section">
            <h2>Recent Donations from Users</h2>
            <div id="donations-list">
              {data.recentDonations && data.recentDonations.length > 0 ? (
                data.recentDonations.slice(0, 3).map((donation, index) => (
                  <div className="donation" key={index}>
                    <strong>{donation.donor_name}</strong> donated ₹{donation.amount}
                  </div>
                ))
              ) : (
                <p>No recent donations available.</p>
              )}
            </div>
          </section>

          {/* Accept/Reject Items */}
          <DonationDecisions messages={data.messages || []} />

          {/* Item History */}
          <section className="donation-items-container">
            <h2 className="donation-header">Donation Items History</h2>
            {data.items && data.items.length > 0 ? (
              data.items.map((item, index) => (
                <div className="donation-item" key={index}>
                  <h5 className="donation-category">Category: {item.category}</h5>
                  <p className="donation-detail"><strong>Location:</strong> {item.location}</p>
                  <p className="donation-detail"><strong>Delivery Date:</strong> {new Date(item.delivery).toLocaleDateString()}</p>
                </div>
              ))
            ) : (
              <p className="no-items">No items available.</p>
            )}
          </section>

        </main>
      </div>

      <Footer />
    </div>
  );
};

export default CarehomeDashboard;