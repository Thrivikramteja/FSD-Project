import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/header';
import Footer from '../components/footer';
import { headerConfig } from "../config/headerConfig";
import styles from '../styles/CorporateDonation.module.css';

const CorporateDonation = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ngo, setNgo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        companyName: '',
        amount: '',
        purpose: '',
        email: ''
    });

    useEffect(() => {
        const fetchNGO = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/NGOs/profile/${id}`);
                const result = await response.json();
                setNgo(result.data.ngo);
                setLoading(false);
            } catch (err) {
                navigate('/error');
            }
        };
        fetchNGO();
    }, [id, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3000/api/b2b/corporate/donate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, ngoId: id })
            });
            if (response.ok) {
                alert("Donation Recorded! A confirmation email has been sent.");
                navigate(`/ngo-profile/${id}`);
            }
        } catch (err) {
            alert("Error submitting donation.");
        }
    };

    if (loading) return <div className={styles.loader}>Initializing B2B Portal...</div>;

    return (
        <div className={styles.wrapper}>
            <Header navItems={headerConfig.landing} />
            <div className={styles.container}>
                <div className={styles.glassCard}>
                    <div className={styles.headerArea}>
                        <span className={styles.badge}>B2B Partnership Portal</span>
                        <h1>Corporate Giving</h1>
                        <p>Supporting <strong>{ngo.Ngoname}</strong></p>
                    </div>

                    <div className={styles.bankInfo}>
                        <div className={styles.grid}>
                            <p><strong>A/C Holder:</strong> {ngo.account_holder_name}</p>
                            <p><strong>IFSC:</strong> {ngo.ifsc}</p>
                            <p><strong>A/C No:</strong> {ngo.account_number}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.field}>
                            <label>Registered Company Name</label>
                            <input type="text" required placeholder="Legal entity name" 
                                onChange={(e) => setFormData({...formData, companyName: e.target.value})} />
                        </div>
                        
                        <div className={styles.field}>
                            <label>Corporate Contact Email</label>
                            <input type="email" required placeholder="For tax receipt & verification" 
                                onChange={(e) => setFormData({...formData, email: e.target.value})} />
                        </div>

                        <div className={styles.field}>
                            <label>Contribution Amount (₹)</label>
                            <input type="number" required min="50000" placeholder="Min ₹50,000 | No Max Limit"
                                onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                        </div>

                        <div className={styles.field}>
                            <label>Purpose of Grant</label>
                            <textarea placeholder="e.g. CSR Initiative, Infrastructure Support" 
                                onChange={(e) => setFormData({...formData, purpose: e.target.value})} />
                        </div>

                        {/* Box 1: Tax Disclaimer */}
                        <div className={styles.taxDisclaimer}>
                            <p><strong>Section 80G Notice:</strong> Donations are eligible for 50% tax exemption. Ensure the email provided matches your corporate tax records for seamless certificate issuance.</p>
                        </div>

                        {/* Box 2: NEW Consent & Fraud Disclaimer */}
                        <div className={styles.consentDisclaimer}>
                            <p><strong>Legal Consent & Fraud Policy:</strong> By proceeding, you verify that this contribution is from a legitimate corporate entity. We reserve the right to initiate legal action and notify authorities in case of fraudulent activity. Clicking 'Confirm' provides explicit consent to share your company details and contact info with <strong>{ngo.Ngoname}</strong> for verification and follow-up.</p>
                        </div>

                        <button type="submit" className={styles.submitBtn}>
                            Confirm & Grant Consent
                        </button>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default CorporateDonation;