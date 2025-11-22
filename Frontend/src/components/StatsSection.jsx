import React, { useState } from 'react';

const StatsSection = ({ name, stats, activeCampaignsCount }) => {
  // Replaces the EJS script that toggles display
  const [showStats, setShowStats] = useState(false);

  return (
    <div className="dashboard-overview">
      <div className="profile-card">
        <div className="org-name">{name}</div>
      </div>

      <button 
        id="toggle-stats-btn" 
        title="for more details"
        onClick={() => setShowStats(!showStats)}
      >
        {showStats ? "Hide Statistics" : "Statistics"}
      </button>

      {/* Conditionally render based on state */}
      {showStats && (
        <div id="stats-container">
          <div className="stats-card">
            <div className="stats-number">{stats.totalFundsRaised}</div>
            <div className="stats-label">Total Raised</div>
          </div>
          <div className="stats-card">
            <div className="stats-number">{activeCampaignsCount}</div>
            <div className="stats-label">Active Campaigns</div>
          </div>
          <div className="stats-card">
            <div className="stats-number">{stats.totalRegistrations}</div>
            <div className="stats-label">Volunteers</div>
          </div>
          <div className="stats-card">
            <div className="stats-number">{stats.careHomesBenefited}</div>
            <div className="stats-label">Care homes Associated</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsSection;