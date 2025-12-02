import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '../components/header';
import Footer from '../components/footer';
import { headerConfig } from "../config/headerConfig"; 
import "../styles/help_pages.css";

// Define the tip percentage and max amount outside the component
const PLATFORM_TIP_PERCENT = 0.08; // 8%
const MAX_DONATION_AMOUNT = 1000000;

const DonateMoneyPage = () => {
    // --- State Management ---
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
    
    // --- Data Fetching (Live API call) ---
    const fetchCareHomes = useCallback(async () => {
        try {
            // 🛑 FIX: Use explicit URL targeting Node.js server
            const response = await fetch('http://localhost:3000/api/carehomes'); 
            
            if (!response.ok) {
                console.error(`Carehomes fetch failed with status: ${response.status}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Assuming the backend returns { carehomes: [...] } or direct array
            let fetchedHomes = Array.isArray(data) ? data : (data.carehomes || []);
            
            // If the API returns successfully but has no data, use a minimal mock fallback
            if (fetchedHomes.length === 0) {
                fetchedHomes = [
                    { carehomeId: 'ch-mock1', care_home_name: "Hope Haven (Fallback)", description: "No live data available." },
                ];
            }
            
            setCarehomes(fetchedHomes);

        } catch (error) {
            console.error('Error fetching care home list:', error);
            // Fallback to mock data on error
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

    // --- Handlers (No Change) ---
    
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

    const handlePaymentSubmit = (e) => {
        e.preventDefault();
        
        if (donationAmount <= 0) {
            setAmountError('Please enter a donation amount greater than zero.');
            return;
        }

        // Using alert() temporarily for mock payment, replace with custom UI later
        alert(`Initiating payment of ₹${totalAmount.toFixed(2)} to ${selectedHome.care_home_name}`);
    };
    
    // --- Formatting Helper ---
    const formatCurrency = (amount) => `₹${amount.toFixed(2).toLocaleString('en-IN')}`;

    return (
        <>
            <Header navItems={headerConfig.landing} />
            
            <div className="min-h-screen pt-4 pb-12 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4">
                    
                    {/* --- 1. Choose Care Home Section --- */}
                    <div className="choose-home bg-white p-6 rounded-xl shadow-md border border-gray-200 mt-8 mb-6">
                        <div className="choose-home-row flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-4">
                            <label htmlFor="some_home" className="flex-shrink-0 font-semibold text-gray-700">
                                Choose a care home:
                            </label>
                            <select 
                                name="carehomes" 
                                id="some_home" 
                                className="flex-grow w-full md:w-auto p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={selectedHomeId}
                                onChange={(e) => setSelectedHomeId(e.target.value)}
                                disabled={loadingHomes || homeChosen}
                            >
                                <option value="" disabled>
                                    {loadingHomes ? "Loading Care Homes..." : "Select a Care Home"}
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
                                className={`flex-shrink-0 px-4 py-2 rounded-lg font-semibold transition-colors ${
                                    homeChosen 
                                    ? 'bg-green-100 text-green-700 cursor-not-allowed' 
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                                disabled={homeChosen || loadingHomes || !selectedHomeId}
                            >
                                {homeChosen ? "Selected" : "Choose it"}
                            </button>
                        </div>
                    </div>
                    
                    {/* --- 2. Donation Main Form Section --- */}
                    {homeChosen && (
                        <div className="donation_main flex flex-col lg:flex-row lg:space-x-8 mt-10">
                            
                            <div className="user_det flex-grow lg:w-2/3 space-y-8">
                                
                                {/* Donation Amount Block */}
                                <div className="fill_money bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                                    <h2 className="text-xl font-bold text-gray-800 mb-4">Donation Amount</h2>
                                    <div className="popular_options flex justify-between space-x-3 mb-4">
                                        {[1000, 2000, 3000].map(amount => (
                                            <button 
                                                key={amount}
                                                type="button" 
                                                onClick={() => handleQuickSelect(amount)}
                                                className={`flex-1 py-3 border rounded-lg font-semibold transition-colors ${
                                                    donationAmount === amount 
                                                    ? 'bg-yellow-500 text-white border-yellow-600' 
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                {formatCurrency(amount)}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <div className="amount-input relative mb-4">
                                        <span className="currency-symbol absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                                        <input 
                                            id="anyamount" 
                                            type="number" 
                                            placeholder="Enter custom amount" 
                                            min="1" 
                                            max={MAX_DONATION_AMOUNT}
                                            value={donationAmount > 0 && donationAmount <= MAX_DONATION_AMOUNT ? donationAmount : ''}
                                            onChange={handleAmountChange}
                                            className={`w-full p-3 pl-8 border rounded-lg text-lg focus:border-blue-500 ${
                                                amountError ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        />
                                        <div className="text-sm text-red-500 mt-1" id="amountError">{amountError}</div>
                                    </div>
                                    
                                    <div className="tip flex justify-between items-center text-gray-700 border-t pt-3 mt-3">
                                        <span className="tip-label font-medium">
                                            Platform Tip ({PLATFORM_TIP_PERCENT * 100}%):
                                        </span>
                                        <span id="show_tip" className="font-semibold text-green-600">
                                            {formatCurrency(tipAmount)}
                                        </span>
                                    </div>
                                    <p className="tip-note text-sm text-center text-gray-500 mt-1">Tips help us scale the platform</p>
                                </div>

                                {/* Your Details Block */}
                                <div className="user_details bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                                    <h2 className="text-xl font-bold text-gray-800 mb-4">Your Details</h2>
                                    <form id="donationForm" onSubmit={handlePaymentSubmit} className="space-y-4">
                                        
                                        {/* Full Name */}
                                        <div className="form-group">
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full name</label>
                                            <input type="text" id="name" required 
                                                value={userDetails.name}
                                                onChange={handleUserDetailsChange}
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500"
                                            />
                                        </div>
                                        
                                        {/* Phone Number */}
                                        <div className="form-group">
                                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone number</label>
                                            <input type="tel" id="phone" pattern="[0-9]{10}" required 
                                                value={userDetails.phone}
                                                onChange={handleUserDetailsChange}
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500"
                                            />
                                        </div>

                                        {/* Email */}
                                        <div className="form-group">
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                                            <input type="email" id="email" required 
                                                value={userDetails.email}
                                                onChange={handleUserDetailsChange}
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500"
                                            />
                                        </div>

                                        {/* PAN Number */}
                                        <div className="form-group">
                                            <label htmlFor="pan" className="block text-sm font-medium text-gray-700">PAN Number</label>
                                            <input type="text" id="pan" pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}" required 
                                                value={userDetails.pan}
                                                onChange={handleUserDetailsChange}
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Required for tax receipt purposes.</p>
                                        </div>

                                        <button type="submit" className="submit-btn w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors" disabled={donationAmount <= 0}>
                                            <span className="button-text">Proceed to pay: {formatCurrency(totalAmount)}</span>
                                            {/* Spinner element removed, replaced with disabled state */}
                                        </button>
                                    </form>
                                    <p className="secured-payment text-sm text-center text-gray-500 mt-3">All payments are securely processed</p>
                                </div>
                            </div>

                            {/* Final Invoice Section (lg:w-1/3) */}
                            <div className="lg:w-1/3 mt-8 lg:mt-0">
                                <div className="invoice_final bg-white p-6 rounded-xl shadow-lg border border-gray-200 sticky top-4">
                                    <div className="invoice-content">
                                        <h3 id="choosen_one" className="text-lg font-bold text-green-700 mb-1">{selectedHome.care_home_name}</h3>
                                        <p id="org-description" className="text-sm text-gray-600 mb-4">{selectedHome.description}</p>
                                        
                                        <div className="invoice-details space-y-2">
                                            <div className="invoice-row flex justify-between">
                                                <span>Donation Amount:</span>
                                                <span id="invoiceDonation" className='font-medium'>{formatCurrency(donationAmount)}</span>
                                            </div>
                                            <div className="invoice-row flex justify-between">
                                                <span>Platform Tip ({PLATFORM_TIP_PERCENT * 100}%):</span>
                                                <span id="invoiceTip" className='font-medium'>{formatCurrency(tipAmount)}</span>
                                            </div>
                                            <hr className="my-2 border-gray-200" />
                                            <div className="invoice-row total flex justify-between text-lg font-bold">
                                                <span>Total Amount:</span>
                                                <span id="invoiceTotal">{formatCurrency(totalAmount)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <Footer />
        </>
    );
};

export default DonateMoneyPage;