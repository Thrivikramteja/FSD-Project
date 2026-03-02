import React, { useState } from 'react';

const StatsSection = ({ name, stats, activeCampaignsCount }) => {
  const [showStats, setShowStats] = useState(false);

  return (
    <div className="dashboard-overview">
      <div className="profile-card">
        <h1 className="org-name">{name}</h1>
      </div>

      <div className="stats-action-wrapper">
        <button 
          id="toggle-stats-btn" 
          className="emerald-stats-btn"
          title="Click for performance overview"
          onClick={() => setShowStats(!showStats)}
        >
          {showStats ? "Hide Performance" : "Show Performance Statistics"}
        </button>
      </div>

      {showStats && (
        <div id="stats-container" className="fade-in">
          <div className="stats-card">
            <div className="stats-number">₹{stats.totalFundsRaised}</div>
            <div className="stats-label">Total Raised</div>
          </div>
          <div className="stats-card">
            <div className="stats-number">{activeCampaignsCount}</div>
            <div className="stats-label">Active Campaigns</div>
          </div>
          <div className="stats-card">
            <div className="stats-number">{stats.totalRegistrations}</div>
            <div className="stats-label">Event Volunteers</div>
          </div>
          <div className="stats-card">
            <div className="stats-number">{stats.careHomesBenefited}</div>
            <div className="stats-label">Care Homes Linked</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsSection;