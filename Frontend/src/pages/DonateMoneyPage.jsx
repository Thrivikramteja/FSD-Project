import { useRef } from "react";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Heart, Sparkles, Shield, Award, TrendingUp, Users, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header';
import Footer from '../components/footer';
import { headerConfig } from "../config/headerConfig"; 
import "../styles/donate_mon.css";

// Define the tip percentage and max amount outside the component
const PLATFORM_TIP_PERCENT = 0.08; // 8%
const MAX_DONATION_AMOUNT = 1000000;

const DonateMoneyPage = () => {
    // --- State Management ---
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [donorData, setDonorData] = useState(null);

    const [carehomes, setCarehomes] = useState([]);
    const [loadingHomes, setLoadingHomes] = useState(true);
    const [selectedHomeId, setSelectedHomeId] = useState('');
    const [homeChosen, setHomeChosen] = useState(false);
    const [donationAmount, setDonationAmount] = useState(0);
    const [amountError, setAmountError] = useState('');

    const [userDetails, setUserDetails] = useState({
        name: 'Guest Donor',
        phone: '', 
        email: 'guest@example.com', 
        pan: '',
    });
    
    useEffect(() => {
  const donorToken = localStorage.getItem("donorToken");
  const donorRaw = localStorage.getItem("donorData");

  if (donorToken && donorRaw) {
    try {
      const parsedDonor = JSON.parse(donorRaw);
      setIsLoggedIn(true);
      setDonorData(parsedDonor);
      setUserDetails({
        name: parsedDonor.name || "",
        phone: parsedDonor.phone || "",
        email: parsedDonor.email || "",
        pan: parsedDonor.pan || "",
      });
    } catch {
      localStorage.removeItem("donorToken");
      localStorage.removeItem("donorData");
    }
  }
}, []);

    // --- Data Fetching (Live API call) ---
    const fetchCareHomes = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:3000/api/carehomes'); 
            
            if (!response.ok) {
                console.error(`Carehomes fetch failed with status: ${response.status}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            let fetchedHomes = Array.isArray(data) ? data : (data.carehomes || []);
            
            if (fetchedHomes.length === 0) {
                fetchedHomes = [
                    { carehomeId: 'ch-mock1', care_home_name: "Hope Haven (Fallback)", description: "No live data available." },
                ];
            }
            
            setCarehomes(fetchedHomes);

        } catch (error) {
            console.error('Error fetching care home list:', error);
            setCarehomes([
                { carehomeId: 'ch-mock1', care_home_name: "Hope Haven (Fallback)", description: "Network or Server Error. Using Mock Data." },
            ]);
        } finally {
            setLoadingHomes(false);
        }
    }, []);

    useEffect(() => {
        fetchCareHomes();
    }, [fetchCareHomes]);

    // --- Derived Calculations ---
    const tipAmount = useMemo(() => {
        return (donationAmount > 0 ? donationAmount * PLATFORM_TIP_PERCENT : 0);
    }, [donationAmount]);

    const totalAmount = useMemo(() => {
        return donationAmount + tipAmount;
    }, [donationAmount, tipAmount]);

    const selectedHome = useMemo(() => {
        return carehomes.find(home => home.carehomeId === selectedHomeId) || { care_home_name: 'N/A', description: '' };
    }, [selectedHomeId, carehomes]);

    // --- Handlers ---
    const handleAmountChange = (e) => {
        let value = parseFloat(e.target.value);
        if (isNaN(value) || value < 0) value = 0;

        if (value > MAX_DONATION_AMOUNT) {
            setAmountError(`Please enter an amount up to ₹${MAX_DONATION_AMOUNT.toLocaleString()}`);
            setDonationAmount(0); 
        } else {
            setAmountError('');
            setDonationAmount(value);
        }
    };

    const handleQuickSelect = (amount) => {
        setAmountError('');
        setDonationAmount(amount);
    };

    const handleUserDetailsChange = (e) => {
        setUserDetails({
            ...userDetails,
            [e.target.id]: e.target.value,
        });
    };

    const handleChooseHome = () => {
        if (selectedHomeId) {
            setHomeChosen(true);
        } else {
            console.error("Please select a care home first."); 
        }
    };

    const handlePaymentSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // // ✅ Check if donor is logged in
    // if (!isLoggedIn || !donorData) {
    //     alert('Please login as a Donor to complete your donation');
    //     navigate('/login');
    //     return;
    // }
    
    setAmountError('');
    
    // Validate donation amount
    if (donationAmount <= 0) {
        setAmountError('Please enter a donation amount greater than zero.');
        return;
    }
    
    // Validate name
    if (!userDetails.name || userDetails.name.trim() === '') {
        alert('Please enter your full name');
        document.getElementById('name')?.focus();
        return;
    }
    
    // Validate phone
    const phoneRegex = /^[0-9]{10}$/;
    if (!userDetails.phone || !phoneRegex.test(userDetails.phone)) {
        alert('Please enter a valid 10-digit phone number');
        document.getElementById('phone')?.focus();
        return;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userDetails.email || !emailRegex.test(userDetails.email)) {
        alert('Please enter a valid email address');
        document.getElementById('email')?.focus();
        return;
    }
    
    // Validate PAN
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!userDetails.pan || !panRegex.test(userDetails.pan.toUpperCase())) {
        alert('Please enter a valid PAN number (e.g., ABCDE1234F)');
        document.getElementById('pan')?.focus();
        return;
    }
    
    // ✅ All validations passed - proceed with API call
    try {
        const donationData = {
            donorId: donorData.donorId || donorData._id,
            carehomeId: selectedHomeId,
            amount: donationAmount,
            tipAmount: tipAmount,
            totalAmount: totalAmount,
            donorDetails: userDetails,
            timestamp: new Date().toISOString()
        };
        
        const response = await fetch('http://localhost:3000/api/donations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('donorToken')}`
            },
            body: JSON.stringify(donationData)
        });
        
        if (response.ok) {
            const result = await response.json();
            alert(`🎉 Payment Successful!\n\nDonation ID: ${result.donationId}\nAmount: ₹${totalAmount.toFixed(2)}\nCare Home: ${selectedHome.care_home_name}\n\nThank you for your generosity!`);
            
            // Optionally redirect to receipt page
            // navigate(`/donation-receipt/${result.donationId}`);
        } else {
            throw new Error('Donation failed');
        }
        
    } catch (error) {
        console.error('Donation error:', error);
        alert('Payment failed. Please try again.');
    }
};
    
    // --- Formatting Helper ---
    const formatCurrency = (amount) => `₹${amount.toFixed(2).toLocaleString('en-IN')}`;

    return (
        <div>

<Header navItems={headerConfig.landing} />

<div className="donation-page-wrapper">
    {/* Hero Section */}
    <div className="donation-hero-section">
        <div className="donation-hero-overlay"></div>
        
        <div className="donation-hero-content">
            <div className="donation-hero-badge">
                <Sparkles style={{width: '16px', height: '16px'}} />
                <span>Make a Difference Today</span>
            </div>
            
            <h1 className="donation-hero-title">
                Transform Lives with
                <span className="donation-hero-gradient-text">Your Generosity</span>
            </h1>
            
            <p className="donation-hero-subtitle">
                Every donation brings hope, care, and comfort to those who need it most
            </p>
            
            <div className="donation-stats-grid">
                <div className="donation-stat-card">
                    <Users style={{width: '24px', height: '24px', color: '#fcd34d', margin: '0 auto'}} />
                    <div className="donation-stat-value">10K+</div>
                    <div className="donation-stat-label">Lives Impacted</div>
                </div>
                <div className="donation-stat-card">
                    <Heart style={{width: '24px', height: '24px', color: '#fcd34d', margin: '0 auto'}} />
                    <div className="donation-stat-value">50+</div>
                    <div className="donation-stat-label">Care Homes</div>
                </div>
                <div className="donation-stat-card">
                    <Award style={{width: '24px', height: '24px', color: '#fcd34d', margin: '0 auto'}} />
                    <div className="donation-stat-value">4.9/5</div>
                    <div className="donation-stat-label">Trust Score</div>
                </div>
            </div>
        </div>
    </div>
    
    <div className="donation-main-content">
        <div className="donation-container">
            
            {/* Choose Care Home */}
            <div className="donation-card">
                <div className="donation-card-decoration"></div>
                
                <div className="donation-card-inner">
                    <div className="donation-card-header">
                        <div className="donation-icon-badge">
                            <Heart style={{width: '24px', height: '24px', color: 'white'}} />
                        </div>
                        <div>
                            <h2 className="donation-card-title">Select Your Cause</h2>
                            <p className="donation-card-subtitle">Choose a care home to support</p>
                        </div>
                    </div>
                    
                    <div className="donation-select-group">
                        <select 
                            className="donation-select-input"
                            value={selectedHomeId}
                            onChange={(e) => setSelectedHomeId(e.target.value)}
                            disabled={loadingHomes || homeChosen}
                        >
                            <option value="" disabled>
                                {loadingHomes ? "🔄 Loading Care Homes..." : "💝 Select a Care Home"}
                            </option>
                            {carehomes.map(home => (
                                <option key={home.carehomeId} value={home.carehomeId}>
                                    {home.care_home_name}
                                </option>
                            ))}
                        </select>
                        <button 
                            type="button" 
                            onClick={handleChooseHome}
                            className={`donation-btn ${homeChosen ? 'donation-btn-success' : 'donation-btn-primary'}`}
                            disabled={homeChosen || loadingHomes || !selectedHomeId}
                        >
                            {homeChosen ? (
                                <>
                                    <CheckCircle2 style={{width: '20px', height: '20px'}} />
                                    Selected
                                </>
                            ) : (
                                <>
                                    Continue
                                    <ArrowRight style={{width: '20px', height: '20px'}} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Login Banner */}
            {isLoggedIn && donorData && (
                <div style={{
                    background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                    padding: '20px',
                    borderRadius: '16px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '2px solid #6ee7b7'
                }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <CheckCircle2 style={{width: '24px', height: '24px', color: '#059669'}} />
                        <div>
                            <p style={{margin: 0, fontWeight: 700, color: '#065f46', fontSize: '1.1rem'}}>
                                Welcome back, {donorData.name}!
                            </p>
                            <p style={{margin: 0, fontSize: '0.875rem', color: '#047857'}}>
                                You're logged in as a donor
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            localStorage.removeItem('donorToken');
                            localStorage.removeItem('donorData');
                            navigate('/login');
                        }}
                        style={{
                            background: 'white',
                            color: '#059669',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: '2px solid #10b981',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                        }}
                    >
                        Logout
                    </button>
                </div>
            )}
            
            {/* Donation Form */}
            {homeChosen && (
                <div className="donation-form-layout">
                    
                    <div>
                        {/* Amount Card */}
                        <div className="donation-card donation-card-amount">
                            <div className="donation-card-inner">
                                <div className="donation-card-header">
                                    <div className="donation-icon-badge" style={{background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)'}}>
                                        <TrendingUp style={{width: '24px', height: '24px', color: 'white'}} />
                                    </div>
                                    <div>
                                        <h2 className="donation-card-title">Your Contribution</h2>
                                        <p className="donation-card-subtitle">Every rupee makes a difference</p>
                                    </div>
                                </div>
                                
                                <div className="donation-amount-buttons">
                                    {[1000, 2000, 3000].map(amount => (
                                        <button 
                                            key={amount}
                                            type="button" 
                                            onClick={() => handleQuickSelect(amount)}
                                            className={`donation-amount-btn ${donationAmount === amount ? 'active' : ''}`}
                                        >
                                            {formatCurrency(amount)}
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="donation-form-group">
                                    <label className="donation-form-label">Custom Amount</label>
                                    <div className="donation-input-wrapper">
                                        <span className="donation-currency-symbol">₹</span>
                                        <input 
                                            type="number" 
                                            placeholder="Enter your amount" 
                                            min="1" 
                                            max={MAX_DONATION_AMOUNT}
                                            value={donationAmount > 0 && donationAmount <= MAX_DONATION_AMOUNT ? donationAmount : ''}
                                            onChange={handleAmountChange}
                                            className={`donation-input-field ${amountError ? 'error' : ''}`}
                                        />
                                    </div>
                                    {amountError && (
                                        <div className="donation-error-message">
                                            <span>⚠️</span>
                                            <span>{amountError}</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="donation-tip-box">
                                    <div className="donation-tip-row">
                                        <span className="donation-tip-label">
                                            <Sparkles style={{width: '16px', height: '16px'}} />
                                            Platform Tip ({PLATFORM_TIP_PERCENT * 100}%)
                                        </span>
                                        <span className="donation-tip-amount">
                                            {formatCurrency(tipAmount)}
                                        </span>
                                    </div>
                                    <p className="donation-tip-note">
                                        💚 Tips help us reach more people in need
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Details Card */}
                        <div className="donation-card">
                            <div className="donation-card-inner">
                                <div className="donation-card-header">
                                    <div className="donation-icon-badge" style={{background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)'}}>
                                        <Users style={{width: '24px', height: '24px', color: 'white'}} />
                                    </div>
                                    <div>
                                        <h2 className="donation-card-title">Your Details</h2>
                                        <p className="donation-card-subtitle">We'll send your receipt here</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="donation-form-group">
                                        <label htmlFor="name" className="donation-form-label">Full Name *</label>
<input 
    type="text" 
    id="name"
    required
    value={userDetails.name}
    onChange={handleUserDetailsChange}
    className="donation-input-field"
    placeholder="Enter your full name"
/>
                                    </div>
                                    
                                    <div className="donation-form-group">
                                        <label htmlFor="phone" className="donation-form-label">Phone Number *</label>
                                        <input 
                                            type="tel" 
                                            id="phone" 
                                            required
                                            pattern="[0-9]{10}"
                                            value={userDetails.phone}
                                            onChange={handleUserDetailsChange}
                                            className="donation-input-field"
                                            placeholder="10-digit mobile number"
                                            maxLength="10"
                                        />
                                    </div>

                                    <div className="donation-form-group">
                                        <label htmlFor="email" className="donation-form-label">Email Address *</label>
<input 
    type="email"
    id="email"
    required
    value={userDetails.email}
    onChange={handleUserDetailsChange}
    className="donation-input-field"
    placeholder="your.email@example.com"
/>
                                    </div>

                                    <div className="donation-form-group">
                                        <label htmlFor="pan" className="donation-form-label">PAN Number *</label>
                                        <input 
                                            type="text" 
                                            id="pan" 
                                            required
                                            pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                                            value={userDetails.pan}
                                            onChange={handleUserDetailsChange}
                                            className="donation-input-field donation-uppercase"
                                            placeholder="ABCDE1234F"
                                            maxLength="10"
                                        />
                                        <p className="donation-field-hint">
                                            <Shield style={{width: '16px', height: '16px'}} />
                                            Required for 80G tax benefits
                                        </p>
                                    </div>

                                    <button 
                                        type="button"
                                        onClick={handlePaymentSubmit}
                                        className="donation-btn donation-btn-submit"
                                        disabled={donationAmount <= 0}
                                    >
                                        <Shield style={{width: '20px', height: '20px'}} />
                                        <span>Secure Payment: {formatCurrency(totalAmount)}</span>
                                        <ArrowRight style={{width: '20px', height: '20px'}} />
                                    </button>
                                </div>
                                
                                <div className="donation-security-badge">
                                    <Shield style={{width: '16px', height: '16px', color: '#16a34a'}} />
                                    <span>256-bit SSL encrypted & PCI DSS compliant</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Sidebar */}
                    <div>
                        <div className="donation-invoice-card">
                            <div className="donation-card-header">
                                <div className="donation-icon-badge" style={{background: 'rgba(255, 255, 255, 0.2)'}}>
                                    <Award style={{width: '24px', height: '24px', color: 'white'}} />
                                </div>
                                <h3 className="donation-invoice-title">Donation Summary</h3>
                            </div>
                            
                            <div className="donation-invoice-home">
                                <h4 className="donation-home-name">
                                    <Heart style={{width: '20px', height: '20px'}} />
                                    {selectedHome.care_home_name}
                                </h4>
                                <p className="donation-home-description">
                                    {selectedHome.description}
                                </p>
                            </div>
                            
                            <div>
                                <div className="donation-invoice-row">
                                    <span>Donation Amount</span>
                                    <span className="donation-invoice-value">{formatCurrency(donationAmount)}</span>
                                </div>
                                <div className="donation-invoice-row">
                                    <span>Platform Tip ({PLATFORM_TIP_PERCENT * 100}%)</span>
                                    <span className="donation-invoice-value">{formatCurrency(tipAmount)}</span>
                                </div>
                                <div className="donation-invoice-row donation-invoice-total">
                                    <span style={{fontSize: '1.5rem', fontWeight: 700}}>Total</span>
                                    <span className="donation-total-amount">{formatCurrency(totalAmount)}</span>
                                </div>
                            </div>
                            
                            <div className="donation-tax-benefit">
                                <CheckCircle2 style={{width: '20px', height: '20px', color: '#86efac', flexShrink: 0}} />
                                <div>
                                    <p className="donation-benefit-title">Tax Benefits</p>
                                    <p className="donation-benefit-text">Get 80G deduction on your tax return</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
    
<Footer />
</div>
</div>

);
};
export default DonateMoneyPage;
