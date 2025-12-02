import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/header';
import Footer from '../components/footer';
import { headerConfig } from "../config/headerConfig";

const WaysToHelpPage = () => {
 return (
 <>
   <Header navItems={headerConfig.landing} /> 
 
   <div className='container my-5' style={{ minHeight: '60vh' }}>
     <h2 className='text-center mb-5 text-3xl font-bold text-gray-800'>🤝 Ways to Help CareConnect</h2>
     
     <div className="row justify-content-center">
     
       {/* 1. Donate Items Card */}
       <div className="col-md-6 col-lg-4 mb-4">
         <div className="card text-center p-6 border rounded-lg shadow-md bg-white 
                                hover:shadow-xl hover:scale-105 transition-all duration-300 h-full flex flex-col justify-between">
           <h5 className="card-title text-2xl font-bold text-green-600 mb-3">🎁 Donate Items</h5>
           <p className="card-text text-gray-700 mb-4 flex-grow">
             Send essential items like food, clothes, or supplies directly to a care home in need.
           </p>
           <Link to="/donate-items" className="btn mt-auto px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition-colors">
             Start Donating Items
           </Link>
         </div>
       </div>

       {/* 2. Donate Money Card */}
       <div className="col-md-6 col-lg-4 mb-4">
         <div className="card text-center p-6 border rounded-lg shadow-md bg-white 
                                hover:shadow-xl hover:scale-105 transition-all duration-300 h-full flex flex-col justify-between">
           <h5 className="card-title text-2xl font-bold text-blue-600 mb-3">💸 Donate Money</h5>
           <p className="card-text text-gray-700 mb-4 flex-grow">
             Provide financial support to cover operational costs, medical care, or specific programs.
           </p>
           <Link to="/donate-funds" className="btn mt-auto px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors">
             Make a Financial Donation
           </Link>
         </div>
       </div>
       
       {/* 3. Jobs Card */}
       <div className="col-md-6 col-lg-4 mb-4">
         <div className="card text-center p-6 border rounded-lg shadow-md bg-white 
                                hover:shadow-xl hover:scale-105 transition-all duration-300 h-full flex flex-col justify-between">
           <h5 className="card-title text-2xl font-bold text-indigo-600 mb-3">💼 Jobs</h5>
           <p className="card-text text-gray-700 mb-4 flex-grow">
             Explore career opportunities and paid positions available at our partner care homes.
           </p>
           <Link to="/jobs" className="btn mt-auto px-4 py-2 bg-indigo-500 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-600 transition-colors">
             View Open Positions
           </Link>
         </div>
       </div>

     </div>
   </div>

   <Footer />
 </>
);
};

export default WaysToHelpPage;