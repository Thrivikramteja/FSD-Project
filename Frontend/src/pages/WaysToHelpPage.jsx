import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/header';
import Footer from '../components/footer';
import { headerConfig } from "../config/headerConfig";
import "../styles/help_pages.css";

const WaysToHelpPage = () => {
return (
<>
  <Header navItems={headerConfig.landing} /> 

 <div className="help-container">
   <h2 className="help-heading"> Ways to Help CareConnect</h2>
   <div className="help-grid">
     <div className="help-card help-card--items">
       <h5 className="help-title"> Donate Items</h5>
       <p className="help-text">Send essential items like food, clothes, or supplies directly to a care home in need.</p>
       <Link to="/donate-items" className="help-btn help-btn--items">Start Donating Items</Link>
     </div>

     <div className="help-card help-card--money">
       <h5 className="help-title"> Donate Money</h5>
       <p className="help-text">Provide financial support to cover operational costs, medical care, or specific programs.</p>
       <Link to="/donate-funds" className="help-btn help-btn--money">Make a Financial Donation</Link>
     </div>

     <div className="help-card help-card--jobs">
       <h5 className="help-title"> Jobs</h5>
       <p className="help-text">Explore career opportunities and paid positions available at our partner care homes.</p>
       <Link to="/jobs" className="help-btn help-btn--jobs">View Open Positions</Link>
     </div>
   </div>
 </div>

  <Footer />
</>
);
};

export default WaysToHelpPage;
