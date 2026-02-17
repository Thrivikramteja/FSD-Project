import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Added this
import Header from '../components/header';
import Footer from '../components/footer';
import { headerConfig } from "../config/headerConfig"; 
import '../styles/allngos.css'; 

const AllNgos = () => {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); 

  useEffect(() => {
    const fetchNgos = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/NGOs");
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();
        setNgos(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        setTimeout(() => { window.location.href = "/error"; }, 5000);
      }
    };
    fetchNgos();
  }, []);

  return (
    <div className="ngo-wrapper">
      <Header navItems={headerConfig.landing} />
      <main className="ngo-main-content">
        <h1 className="ngo-title">NGOs awarded Trusted Organization Certification</h1>
        {!loading && !error && ngos.length > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {ngos.map((ngo) => (
              /* Added onClick to trigger navigation to the profile page */
              <div className="ngo-card" key={ngo._id} onClick={() => navigate(`/ngo-profile/${ngo.ngoId}`)} style={{ cursor: 'pointer' }}>
                <div className="ngo-details">
                  <h2>{ngo.Ngoname}</h2>
                  <p><strong>Phone:</strong> {ngo.phone}</p>
                  <p><strong>Email:</strong> {ngo.email}</p>
                </div>
                <div className="ngo-revenue">
                  <p style={{ fontWeight: 'bold', color: '#888', textTransform: 'uppercase' }}>FY YOE - 2025</p>
                  <p><strong>Total Revenue</strong><span>Rs. {ngo.totalFundsRaised}</span></p>
                  <p><strong>Care Homes Benefited</strong><span>{ngo.careHomesBenefited}</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AllNgos;