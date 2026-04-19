import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

  // --- Search & Pagination State for all sections ---
  const [search, setSearch] = useState({ 
    ongoing: "", 
    completed: "", 
    upcoming: "", 
    corporate: "" 
  });
  
  const [limits, setLimits] = useState({ 
    ongoing: 5, 
    completed: 5, 
    upcoming: 5, 
    corporate: 5 
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/ngo-dashboard/${ngoID}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
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
      }
    };

    fetchData();
  }, [ngoID]);

  // Helper function to filter and slice data for "Show More"
  const getDisplayData = (list, searchTerm, limit, key) => {
    const filtered = (list || []).filter(item => 
      (item[key] || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    return {
      items: filtered.slice(0, limit),
      hasMore: filtered.length > limit
    };
  };

  const handleRowClick = (item, category) => {
    const itemId = item._id || item.id;
    let type = category === "completed" ? (item.fundraiser_name ? "fundraiser" : "event") : category;
    navigate(`/NGO-dashboard/${ngoID}/details/${type}/${itemId}`);
  };

  if (loading) return <div>Loading Dashboard...</div>;
  if (error) return <div style={{ textAlign: "center", color: "red" }}>Error: {error}</div>;
  if (!data) return <div>No data found.</div>;

  // Processing display data for each section
  const ongoing = getDisplayData(data.ongoing_fund, search.ongoing, limits.ongoing, "fundraiser_name");
  const upcoming = getDisplayData(data.upcoming_eve, search.upcoming, limits.upcoming, "event_name");
  
  const completedRaw = [
    ...(data.completed_fund || []),
    ...(data.completed_event || []).map((e) => ({ ...e, isEvent: true })),
  ];
  // Filtering completed by name (using fundraiser_name or event_name logic)
  const completed = getDisplayData(completedRaw, search.completed, limits.completed, "fundraiser_name"); 

  return (
    <div className="ngo-dashboard-page">
      <Header ngoID={ngoID} />

      <StatsSection
        name={data.name}
        stats={data.stats}
        activeCampaignsCount={data.upcoming_eve ? data.upcoming_eve.length : 0}
      />

      {/* --- Section 1: Ongoing Fundraisers --- */}
      <div className="dash-table-container">
        <input 
          type="text" 
          placeholder="Search ongoing fundraisers..." 
          className="dash-search" 
          onChange={(e) => setSearch({...search, ongoing: e.target.value})} 
        />
        <TableSection
          containerId="ongoing_fund"
          title="Ongoing Fundraisers"
          data={ongoing.items}
          columns={["Fundraiser Name", "Last Date", "Category"]}
          onRowClick={(item) => handleRowClick(item, "fundraiser")}
        />
        {ongoing.hasMore && (
          <button className="load-more-btn" onClick={() => setLimits({...limits, ongoing: limits.ongoing + 5})}>
            Show More
          </button>
        )}
      </div>

      {/* --- Section 2: NEW Corporate Partnerships Link --- */}
      <div className="dash-table-container">
        <div className="page_headi">Corporate Partnerships</div>
        <div style={{ padding: "0 30px", marginTop: "15px", marginBottom: "30px" }}>
            <p style={{ color: "#64748b", marginBottom: "15px" }}>
                View detailed records of bulk donations and corporate grants.
            </p>
            <button 
                className="load-more-btn" 
                style={{ margin: "0", background: "#10b981", color: "white" }}
                onClick={() => navigate(`/NGO-dashboard/${ngoID}/corporate-donations`)}
            >
                🏢 View All Corporate Records →
            </button>
        </div>
      </div>

      {/* --- Section 3: Completed History --- */}
      <div className="dash-table-container">
        <input 
          type="text" 
          placeholder="Search history..." 
          className="dash-search" 
          onChange={(e) => setSearch({...search, completed: e.target.value})} 
        />
        <TableSection
          containerId="completed_fund"
          title="Completed Fundraisers and Events"
          data={completed.items}
          columns={["Name", "Date", "Category"]}
          emptyMessage="No completed fundraisers or events available."
          onRowClick={(item) => handleRowClick(item, "completed")}
        />
        {completed.hasMore && (
          <button className="load-more-btn" onClick={() => setLimits({...limits, completed: limits.completed + 5})}>
            Show More
          </button>
        )}
      </div>

      {/* --- Section 4: Upcoming Events --- */}
      <div className="dash-table-container">
        <input 
          type="text" 
          placeholder="Search upcoming events..." 
          className="dash-search" 
          onChange={(e) => setSearch({...search, upcoming: e.target.value})} 
        />
        <TableSection
          containerId="upcoming_ev"
          title="Upcoming Events"
          data={upcoming.items}
          columns={["Event Name", "Happening On", "Category"]}
          emptyMessage="No upcoming events are scheduled."
          onRowClick={(item) => handleRowClick(item, "event")}
        />
        {upcoming.hasMore && (
          <button className="load-more-btn" onClick={() => setLimits({...limits, upcoming: limits.upcoming + 5})}>
            Show More
          </button>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default NGODashboard;