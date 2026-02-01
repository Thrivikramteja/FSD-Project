import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

import '../styles/ngo_das.css'; 

import Header from '../components/Ngoheader';
import StatsSection from '../components/StatsSection';
import TableSection from '../components/TableSection';
import Footer from '../components/footer'; 

const NGODashboard = () => {
  const { ngoID } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try { 
        const response = await fetch(`http://localhost:3000/api/ngo-dashboard/${ngoID}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include' 
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || "Failed to load NGO dashboard");
        }

        const result = await response.json();
        
        setData(result);
        setLoading(false);

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);

        setError(err.message || "Dashboard fetch failed");
        setLoading(false);

        setTimeout(() => {
          window.location.href = "/error";
        }, 5000);
      }
    };

    fetchData();
  }, [ngoID]);

  if (loading) return <div>Loading Dashboard...</div>;

  if (error)
    return (
      <div style={{ textAlign: "center", color: "red" }}>
        Error: {error}
      </div>
    );

  if (!data) return <div>No data found.</div>;

  return (
    <div className="ngo-dashboard-page">
      
      <Header ngoID={ngoID} />

      <StatsSection 
        name={data.name} 
        stats={data.stats} 
        activeCampaignsCount={data.upcoming_eve ? data.upcoming_eve.length : 0}
      />

      <TableSection 
        containerId="ongoing_fund"
        title="Ongoing Fundraisers"
        data={data.ongoing_fund || []}
        columns={["Fundraiser Name", "Last Date"]}
        emptyMessage="No ongoing fundraisers available at the moment."
      />

      <TableSection 
        containerId="completed_fund"
        title="Completed Fundraisers and Events"
        data={[...(data.completed_fund || []), ...(data.completed_event || [])]}
        columns={[]} 
        emptyMessage="No completed fundraisers or events available."
      />

      <TableSection 
        containerId="upcoming_ev"
        title="Upcoming Events"
        data={data.upcoming_eve || []}
        columns={["Event Name", "Happening On"]}
        emptyMessage="No upcoming events are scheduled."
      />

      <div className="edit-events-link">
        <Link to={`/NGO-dashboard/${ngoID}/edit-event`}>Edit Events</Link>
      </div>

      <Footer />
    </div>
  );
};

export default NGODashboard;
