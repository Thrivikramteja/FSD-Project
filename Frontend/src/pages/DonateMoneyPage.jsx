import { useRef } from "react";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Heart, Sparkles, Shield, Award, TrendingUp, Users, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from "react-router-dom";
import Header from '../components/header';
import Footer from '../components/footer';
import { headerConfig } from "../config/headerConfig"; 
import "../styles/donate_mon.css";

const PLATFORM_TIP_PERCENT = 0.08; 
const MAX_DONATION_AMOUNT = 1000000;

const DonateMoneyPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const carehomeId = searchParams.get("carehome_id");

    const [carehomes, setCarehomes] = useState([]);
    const [loadingHomes, setLoadingHomes] = useState(true);
    const [error, setError] = useState(null); // NEW

    const [selectedHomeId, setSelectedHomeId] = useState(carehomeId || '');
    const [homeChosen, setHomeChosen] = useState(!!carehomeId);
    
    const [donationAmount, setDonationAmount] = useState(0);
    const [amountError, setAmountError] = useState('');

    const [userDetails, setUserDetails] = useState({
        name: 'Guest Donor',
        phone: '', 
        email: 'guest@example.com', 
        pan: '',
    });

    const fetchCareHomes = useCallback(async () => {
        try {
            const response = await fetch(`https://fsd-project-backend-2bms.onrender.com/api/carehomes`); 

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            let fetchedHomes = Array.isArray(data) ? data : (data.carehomes || []);
            setCarehomes(fetchedHomes);

            if (carehomeId) {
                setSelectedHomeId(carehomeId);
                setHomeChosen(true);
            }

        } catch (err) {
            console.error('Error fetching care home list:', err);
            setError(err.message || "Failed to load care homes");

            setTimeout(() => {
                window.location.href = "/error";
            }, 5000);

        } finally {
            setLoadingHomes(false);
        }
    }, [carehomeId]);

    useEffect(() => {
        fetchCareHomes();
    }, [fetchCareHomes]);

    const tipAmount = useMemo(() => (donationAmount > 0 ? donationAmount * PLATFORM_TIP_PERCENT : 0), [donationAmount]);
    const totalAmount = useMemo(() => donationAmount + tipAmount, [donationAmount, tipAmount]);

    const selectedHome = useMemo(() => {
        return carehomes.find(home => String(home.carehomeId) === String(selectedHomeId)) || { care_home_name: 'N/A', description: '' };
    }, [selectedHomeId, carehomes]);

    const handleAmountChange = (e) => {
        let value = parseFloat(e.target.value);
        if (isNaN(value) || value < 0) value = 0;

        if (value > MAX_DONATION_AMOUNT) {
            setAmountError(`Max limit ₹${MAX_DONATION_AMOUNT.toLocaleString()}`);
            setDonationAmount(0); 
        } else {
            setAmountError('');
            setDonationAmount(value);
        }
    };

    const handleQuickSelect = (amount) => { setAmountError(''); setDonationAmount(amount); };
    const handleUserDetailsChange = (e) => { setUserDetails({ ...userDetails, [e.target.id]: e.target.value }); };
    const handleChooseHome = () => { if (selectedHomeId) setHomeChosen(true); };

    const handlePaymentSubmit = async (e) => {
        if (e) e.preventDefault();

        if (donationAmount <= 0) { setAmountError('Enter an amount > 0'); return; }
        if (!userDetails.pan) { alert('PAN is required'); return; }

        try {
            const response = await fetch(`https://fsd-project-backend-2bms.onrender.com/api/carehome/${selectedHomeId}/donate-money`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('donorToken')}`
                },
                credentials: 'include', 
                body: JSON.stringify({ 
                    total: donationAmount, 
                    userDetails: userDetails 
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Donation failed');
            }

            alert(`Donation of ₹${donationAmount} Successful to ${selectedHome.care_home_name}!`);
            navigate('/');

        } catch (err) {
            console.error('Donation error:', err);

            setError(err.message || "Payment failed");

            setTimeout(() => {
                window.location.href = "/error";
            }, 5000);
        }
    };

    const formatCurrency = (amount) => `₹${amount.toFixed(2).toLocaleString('en-IN')}`;

    return (
        <div>
            <Header navItems={headerConfig.landing} />
            {error && (
                <p style={{ color: "red", textAlign: "center" }}>
                    Error: {error}
                </p>
            )}
            <div className="donation-page-wrapper">
                <div className="donation-hero-section">
                    <div className="donation-hero-content">
                        <h1 className="donation-hero-title">Transform Lives with <span className="donation-hero-gradient-text">Your Generosity</span></h1>
                        <p className="donation-hero-subtitle">Every donation brings hope to those who need it most</p>
                    </div>
                </div>

                <div className="donation-main-content">
                    <div className="donation-container">
                        <div className="donation-card">
                            <div className="donation-card-inner">
                                <div className="donation-card-header">
                                    <div className="donation-icon-badge"><Heart style={{width: '24px', height: '24px', color: 'white'}} /></div>
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
                                        <option value="" disabled>{loadingHomes ? "🔄 Loading..." : "💝 Select a Care Home"}</option>
                                        {carehomes.map(home => (
                                            <option key={home.carehomeId} value={home.carehomeId}>{home.care_home_name}</option>
                                        ))}
                                    </select>
                                    {!homeChosen && (
                                        <button type="button" onClick={handleChooseHome} className="donation-btn donation-btn-primary">
                                            Continue <ArrowRight />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {homeChosen && (
                            <div className="donation-form-layout">
                                <div className="donation-main-column">
                                    <div className="donation-card">
                                        <div className="donation-card-inner">
                                            <h2 className="donation-card-title">Contribution Amount</h2>
                                            <div className="donation-amount-buttons">
                                                {[1000, 2000, 5000].map(amt => (
                                                    <button key={amt} onClick={() => handleQuickSelect(amt)} className={`donation-amount-btn ${donationAmount === amt ? 'active' : ''}`}>{formatCurrency(amt)}</button>
                                                ))}
                                            </div>
                                            <input type="number" value={donationAmount || ''} onChange={handleAmountChange} className="donation-input-field" placeholder="Enter Amount" />
                                        </div>
                                    </div>

                                    <div className="donation-card">
                                        <div className="donation-card-inner">
                                            <h2 className="donation-card-title">Donor Information</h2>
                                            <div className="donation-form-group">
                                                <label className="donation-form-label">PAN Number (Required for Tax Benefit)</label>
                                                <input type="text" id="pan" value={userDetails.pan} onChange={handleUserDetailsChange} className="donation-input-field donation-uppercase" placeholder="ABCDE1234F" />
                                            </div>
                                            <button onClick={handlePaymentSubmit} className="donation-btn donation-btn-submit">
                                                <Shield /> Secure Payment: {formatCurrency(totalAmount)}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="donation-sidebar">
                                    <div className="donation-invoice-card">
                                        <h3 className="donation-invoice-title">Summary</h3>
                                        <p><strong>Carehome:</strong> {selectedHome.care_home_name}</p>
                                        <hr />
                                        <div className="donation-invoice-row"><span>Amount</span><span>{formatCurrency(donationAmount)}</span></div>
                                        <div className="donation-invoice-row"><span>Tip</span><span>{formatCurrency(tipAmount)}</span></div>
                                        <div className="donation-invoice-row donation-invoice-total"><span>Total</span><span>{formatCurrency(totalAmount)}</span></div>
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