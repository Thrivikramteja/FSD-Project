import React from 'react';
import { Link } from 'react-router-dom';

const CareHeader = ({ careid }) => {
  return (
    <header className="header">
      <Link to="/" className="logo">CareConnect</Link>
      <nav>
        <ul className="header-right">
          <Link to="/logout" style={{ marginRight: '3rem' }}>Logout</Link>
          <Link to={`/carehome-dashboard/${careid}/edit`} style={{ marginRight: '3rem' }}>Edit Profile</Link>
          <Link to="/carehome-dashboard/get-job">Create a job</Link>
        </ul>
      </nav>
    </header>
  );
};

export default CareHeader;