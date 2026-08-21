import { apiFetch } from "../services/api";
import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/header';
import Footer from '../components/footer';
import { AuthContext } from '../components/authContext';
import styles from '../styles/DonorRegistration.module.css';

const DonorRegistration = () => {
    const { ngoId, eventName } = useParams();
    const navigate = useNavigate();
    const { auth } = useContext(AuthContext);
    
    const [eventDetails, setEventDetails] = useState(null);
    const [formData, setFormData] = useState({
        name: '', email: '', number: '', age: '', address: '', terms: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!auth.loading) {
            if (!auth.user || auth.role !== 'Donor') {
                setError('Please login as a Donor to proceed with registration.');
                setTimeout(() => navigate('/'), 3000);
                return;
            }
            if (auth.user) {
                setFormData(prev => ({
                    ...prev,
                    name: auth.user.name || '',
                    email: auth.user.email || '',
                    number: auth.user.mobile_number || '',
                    age: auth.user.age || '',
                    address: auth.user.address || ''
                }));
            }
        }

        const fetchEventInfo = async () => {
            try {
                const response = await apiFetch(`/api/event-details/${ngoId}/${eventName}`);
                const data = await response.json();
                if (data.success) setEventDetails(data.event);
            } catch (err) {
                console.error("Context load failed", err);
            }
        };
        fetchEventInfo();
    }, [auth, navigate, ngoId, eventName]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await apiFetch(`/registerUser/${ngoId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    ...formData,
                    event: decodeURIComponent(eventName),
                    ngoID: ngoId
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Registration Failed");
            alert("Registration Successful!"); 
            navigate('/');
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div>
            <Header navItems={[{ label: "Home", path: "/" }, { label: "Events", path: "/events" }]} />
            <div className={styles.donorRegWrapper}>
                <div className={styles.donorRegContainer}>
                    {error && <div className={styles.errorMessage}>{error}</div>}
                    
                    {!error && (
                        <>
                            {eventDetails && (
                                <div className={styles.eventPreviewCard}>
                                    <div className={styles.eventInfoContent}>
                                        <h2 className={styles.eventHeader}>{eventDetails.event_name}</h2>
                                        <div className={styles.infoGrid}>
                                            <div className={styles.infoItem}><strong>Location:</strong> {eventDetails.event_location}</div>
                                            <div className={styles.infoItem}><strong>Date:</strong> {new Date(eventDetails.event_date).toLocaleDateString()}</div>
                                            <div className={styles.infoItem}><strong>Time:</strong> {eventDetails.event_time}</div>
                                            <div className={styles.infoItem}><strong>Organizer:</strong> {eventDetails.ngoName}</div>
                                        </div>
                                        <p className={styles.eventDescription}>{eventDetails.description}</p>
                                    </div>
                                </div>
                            )}

                            <h3 className={styles.donorRegTitle}>Confirm Registration</h3>

                            <form className={styles.donorRegForm} onSubmit={handleSubmit}>
                                <input type="text" name="name" className={styles.donorRegInput} value={formData.name} onChange={handleChange} placeholder="Full Name" required />
                                <input type="email" name="email" className={styles.donorRegInput} value={formData.email} onChange={handleChange} placeholder="Email" required />
                                <input type="text" name="number" className={styles.donorRegInput} value={formData.number} onChange={handleChange} placeholder="Phone Number" required />
                                <input type="number" name="age" className={styles.donorRegInput} value={formData.age} onChange={handleChange} placeholder="Age" required />
                                <input type="text" name="address" className={styles.donorRegInput} value={formData.address} onChange={handleChange} placeholder="Address" required />

                                <label className={styles.donorRegLabel}>
                                    <input type="checkbox" name="terms" className={styles.donorRegCheckbox} checked={formData.terms} onChange={handleChange} required />
                                    I agree to the Terms and Conditions
                                </label>

                                <button type="submit" className={styles.donorRegBtn} disabled={loading}>
                                    {loading ? "Registering..." : "Complete Registration"}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default DonorRegistration;