import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/header'; 
import Footer from '../components/footer'; 
import { headerConfig } from "../config/headerConfig"; 

const DonatePage = () => {
    const [carehomes, setCarehomes] = useState([]);
    const [loadingHomes, setLoadingHomes] = useState(true);
    const [error, setError] = useState(null); // NEW

    const [formData, setFormData] = useState({
        carehomes: '',
        category: '',
        description: '',
        address: '',
        date: '',
    });

    const [message, setMessage] = useState({ type: '', text: '' });
    const ENDPOINT_URL = '/donate_items_user'; 

    const fetchCareHomes = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:3000/api/carehomes'); 
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || `HTTP error ${response.status}`);
            }

            const data = await response.json();
            let fetchedHomes = Array.isArray(data) ? data : (data.carehomes || []);
            setCarehomes(fetchedHomes);

        } catch (err) {
            console.error('Error fetching care home list:', err);

            setError(err.message || "Failed to load care homes");

            setTimeout(() => {
                window.location.href = "/error";
            }, 5000);

        } finally {
            setLoadingHomes(false);
        }
    }, []);

    useEffect(() => {
        fetchCareHomes();
    }, [fetchCareHomes]);

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
        setError(null);

        try {
            const response = await fetch(`http://localhost:3000${ENDPOINT_URL}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'include',
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(result.message || "Server failed to save request.");
            }

            setMessage({ type: 'success', text: 'Donation request sent! Awaiting confirmation.' });
            alert('Donation request sent! Awaiting confirmation.');
            setFormData({ carehomes: '', category: '', description: '', address: '', date: '' });

        } catch (err) {
            console.error('Network Error:', err);

            setError(err.message || "Network error occurred");

            setTimeout(() => {
                window.location.href = "/error";
            }, 5000);
        }
    };

    const getAlertClass = (type) => {
        if (type === 'success') {
            return 'bg-green-100 text-green-700 border-green-700';
        } else if (type === 'danger') {
            return 'bg-red-100 text-red-700 border-red-700';
        }
        return '';
    };

    return (
        <>
            <Header navItems={headerConfig.landing} /> 
            
            <div className="container mx-auto mt-5">
                <h2 className="text-center mb-4 text-3xl font-bold text-green-700">Donate Items</h2>

                <div className="max-w-xl mx-auto p-4 md:p-6 bg-white rounded-xl shadow-lg border border-green-300">

                    {error && (
                        <p style={{ color: "red", textAlign: "center" }}>
                            Error: {error}
                        </p>
                    )}
                    
                    <div id="message-container" className="mb-4">
                        {message.text && (
                            <div className={`p-3 border rounded-lg ${getAlertClass(message.type)}`} role="alert">
                                <strong>{message.text}</strong>
                            </div>
                        )}
                    </div>

                    <form id="donateItemsForm" onSubmit={handleSubmit} className="space-y-4">
                        
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
                                {carehomes.map(home => (
                                    <option key={home.carehomeId} value={home.carehomeId}>
                                        {home.care_home_name}
                                    </option>
                                ))}
                            </select>
                            {loadingHomes && <p className="text-xs text-gray-500 mt-1">Fetching list of partner homes...</p>}
                        </div>

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
