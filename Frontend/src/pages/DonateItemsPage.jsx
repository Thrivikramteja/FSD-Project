import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/header'; 
import Footer from '../components/footer'; 
// 🛑 CRITICAL IMPORT: Need the nav items config to prevent Header crash
import { headerConfig } from "../config/headerConfig"; 

const DonatePage = () => {
    // --- Data State ---
    const [carehomes, setCarehomes] = useState([]);
    const [loadingHomes, setLoadingHomes] = useState(true);
    
    // --- Form State (Initialized to empty strings) ---
    const [formData, setFormData] = useState({
        carehomes: '', // Stores selected carehomeId
        category: '',
        description: '',
        address: '',
        date: '',
    });

    const [message, setMessage] = useState({ type: '', text: '' });
    const ENDPOINT_URL = '/donate_items_user'; 

    // --- 1. Data Fetching (CRITICAL STEP) ---
    const fetchCareHomes = useCallback(async () => {
        try {
            // NOTE: Replace this mock implementation with your actual backend endpoint (e.g., /api/carehomes)
            const response = await fetch('http://localhost:3000/api/carehomes'); 
            
            if (!response.ok) {
                console.error(`Carehomes fetch failed with status: ${response.status}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Assuming your backend returns { carehomes: [...] } or just an array [...]
            let fetchedHomes = Array.isArray(data) ? data : (data.carehomes || []);
            
            setCarehomes(fetchedHomes);

        } catch (error) {
            console.error('Error fetching care home list:', error);
            // Fallback to mock data if API fails to prevent crash
            setCarehomes([
                { carehomeId: 'ch-mock1', care_home_name: "Hope Haven (Mock)" },
                { carehomeId: 'ch-mock2', care_home_name: "Sunset Gardens (Mock)" }
            ]);
        } finally {
            setLoadingHomes(false);
        }
    }, []);

    useEffect(() => {
        fetchCareHomes();
    }, [fetchCareHomes]);

    // --- 2. Handlers ---
    
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        if (message.text) {
            setMessage({ type: '', text: '' });
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage({ type: '', text: '' }); 

        try {
            const response = await fetch(ENDPOINT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Donation request sent! Awaiting confirmation.' });
                // Reset form data on success
                setFormData({ carehomes: '', category: '', description: '', address: '', date: '' });
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Server failed to save request.' }));
                console.error('Submission Failed:', errorData);
                setMessage({ 
                    type: 'danger', 
                    text: `Submission Failed: ${errorData.message || 'Please check your input and try again.'}` 
                });
            }
        } catch (error) {
            console.error('Network Error:', error);
            setMessage({ type: 'danger', text: 'A network error occurred. Check your connection.' });
        }
    };

    // Helper function to dynamically set Bootstrap class for the message
    const getAlertClass = (type) => {
        // We use Tailwind classes for styling integrity
        if (type === 'success') {
            return 'bg-green-100 text-green-700 border-green-700';
        } else if (type === 'danger') {
            return 'bg-red-100 text-red-700 border-red-700';
        }
        return '';
    };

    return (
        <>
            {/* 🛑 FIX: Pass navItems prop to prevent crash */}
            <Header navItems={headerConfig.landing} /> 
            
            <div className="container mx-auto mt-5">
                <h2 className="text-center mb-4 text-3xl font-bold text-green-700">Donate Items</h2>

                <div className="max-w-xl mx-auto p-4 md:p-6 bg-white rounded-xl shadow-lg border border-green-300">
                    
                    {/* Message Container */}
                    <div id="message-container" className="mb-4">
                        {message.text && (
                            <div className={`p-3 border rounded-lg ${getAlertClass(message.type)}`} role="alert">
                                <strong>{message.text}</strong>
                            </div>
                        )}
                    </div>

                    <form id="donateItemsForm" onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* Choose a care home */}
                        <div>
                            <label htmlFor="some_home" className="block text-sm font-medium text-gray-700 mb-1">Choose a care home</label>
                            <select 
                                name="carehomes" 
                                id="some_home" 
                                className="w-full p-2 border border-gray-300 rounded-lg focus:border-green-500" 
                                required
                                value={formData.carehomes}
                                onChange={handleChange}
                                disabled={loadingHomes}
                            >
                                <option value="" disabled>
                                    {loadingHomes ? "Loading Care Homes..." : "Select a Care Home"}
                                </option>
                                {/* Mapping the carehomes data (this is the array that must be populated) */}
                                {carehomes.map(home => (
                                    <option key={home.carehomeId} value={home.carehomeId}>
                                        {home.care_home_name}
                                    </option>
                                ))}
                            </select>
                            {loadingHomes && <p className="text-xs text-gray-500 mt-1">Fetching list of partner homes...</p>}
                        </div>

                        {/* Select Donation Category */}
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Select Donation Category</label>
                            <select 
                                className="w-full p-2 border border-gray-300 rounded-lg focus:border-green-500"
                                id="category" 
                                name="category" 
                                required
                                value={formData.category}
                                onChange={handleChange}
                            >
                                <option value="" disabled>Select an option</option>
                                <option value="Food">Food</option>
                                <option value="Clothes">Clothes</option>
                                <option value="Books">Books</option>
                                <option value="Toys">Toys</option>
                                <option value="Medical Supplies">Medical Supplies</option>
                                <option value="others">Others</option>
                            </select>
                        </div>

                        {/* Description (Optional) */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                            <textarea
                                className="w-full p-2 border border-gray-300 rounded-lg focus:border-green-500"
                                id="description"
                                name="description"
                                rows="3"
                                value={formData.description}
                                onChange={handleChange}
                            ></textarea>
                        </div>

                        {/* Pickup/Drop Location */}
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Pickup/Drop Location</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:border-green-500"
                                id="address"
                                name="address"
                                required
                                value={formData.address}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Date of delivery */}
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date of delivery</label>
                            <input
                                type="date"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:border-green-500"
                                id="date"
                                name="date"
                                required
                                value={formData.date}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="text-center pt-4">
                            <button type="submit" className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors">
                                Donate Now
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <Footer />
        </>
    );
};

export default DonatePage;