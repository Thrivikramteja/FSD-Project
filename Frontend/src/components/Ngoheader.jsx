import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ ngoID }) => {
  return (
    <div id="header">
      <Link to="/">CareConnect</Link>
      <div id="header_right">
        <Link to={`/NGO-dashboard/${ngoID}/create-fundraiser`}>Create Fundraiser</Link>
        <Link to={`/NGO-dashboard/${ngoID}/create-event`}>Create Event</Link>
        <Link to={`/NGO-dashboard/${ngoID}/edit`}>Edit your profile</Link>
      </div>
    </div>
  );
};

export default Header;