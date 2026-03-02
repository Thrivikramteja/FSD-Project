import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

import "../styles/ngo_das.css";

import Header from "../components/Ngoheader";
import StatsSection from "../components/StatsSection";
import TableSection from "../components/TableSection";
import Footer from "../components/footer";

const NGODashboard = () => {
  const { ngoID } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/ngo-dashboard/${ngoID}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

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
      }
    };

    fetchData();
  }, [ngoID]);

  const handleRowClick = (item, category) => {
    const itemId = item._id || item.id;

    let type = category;
    if (category === "completed") {
      type = item.fundraiser_name ? "fundraiser" : "event";
    }

    navigate(`/NGO-dashboard/${ngoID}/details/${type}/${itemId}`);
  };

  if (loading) return <div>Loading Dashboard...</div>;
  if (error)
    return (
      <div style={{ textAlign: "center", color: "red" }}>Error: {error}</div>
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
        /* Category added to match the layout of the details page */
        columns={["Fundraiser Name", "Last Date", "Category"]}
        onRowClick={(item) => handleRowClick(item, "fundraiser")}
      />

      <TableSection
        containerId="completed_fund"
        title="Completed Fundraisers and Events"
        data={[
          ...(data.completed_fund || []),
          ...(data.completed_event || []).map((e) => ({ ...e, isEvent: true })),
        ]}
        columns={["Name", "Date", "Category"]}
        emptyMessage="No completed fundraisers or events available."
        
        onRowClick={(item) => handleRowClick(item, "completed")}
      />

      <TableSection
        containerId="upcoming_ev"
        title="Upcoming Events"
        data={data.upcoming_eve || []}
        columns={["Event Name", "Happening On", "Category"]}
        emptyMessage="No upcoming events are scheduled."
        onRowClick={(item) => handleRowClick(item, "event")}
      />

      {/* <div className="edit-events-link">
        <Link to={`/NGO-dashboard/${ngoID}/edit-event`}>Edit Events</Link>
      </div> */}

      <Footer />
    </div>
  );
};

export default NGODashboard;
