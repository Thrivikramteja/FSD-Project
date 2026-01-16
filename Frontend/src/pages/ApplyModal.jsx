import React, { useState } from 'react';
import styles from '../styles/ApplyModal.module.css';

const ApplyModal = ({ jobTitle, jobPay, onClose, onSubmit, isLoading }) => {
    const [formData, setFormData] = useState({
        experience: '',
        whyMe: '',
        location: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modalCard}>
                <div className={styles.header}>
                    <div>
                        <h2 className={styles.title}>Apply for {jobTitle}</h2>
                        {/* Pay Display */}
                        <div className={styles.payDisplay}>
                            <strong>Offered Pay:</strong> ₹{jobPay || 'Negotiable'}
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                </div>
                
                {/* Warning Message Box */}
                <div className={styles.warningBox}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>Note: The final pay can be negotiated or may differ based on specific care requirements.</span>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label>Years of Experience</label>
                        <input 
                            type="number" 
                            name="experience" 
                            placeholder="e.g. 2" 
                            required 
                            value={formData.experience}
                            onChange={handleChange}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Current Location (City)</label>
                        <input 
                            type="text" 
                            name="location" 
                            placeholder="e.g. Sricity" 
                            required 
                            value={formData.location}
                            onChange={handleChange}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Why are you interested in this role?</label>
                        <textarea 
                            name="whyMe" 
                            placeholder="Briefly describe your interest and any specific skills..." 
                            required 
                            rows="4"
                            value={formData.whyMe}
                            onChange={handleChange}
                        ></textarea>
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                        {isLoading ? "Sending Application..." : "Submit Application"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ApplyModal;