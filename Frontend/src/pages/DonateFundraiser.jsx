import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/header';
import Footer from '../components/footer';
import styles from '../styles/DonateFundraiser.module.css';

const DonateFundraiser = () => {
    const { ngoId, name_fund } = useParams();
    const navigate = useNavigate();
    
    const [userData, setUserData] = useState({
        name: "", 
        email: "",
        mobile_number: "" 
    });

    const [loadingUser, setLoadingUser] = useState(true);
    const [amount, setAmount] = useState(0);
    const [tip, setTip] = useState(0);
    const [total, setTotal] = useState(0);
    const [pan, setPan] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- FETCH USER DATA ---
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch("http://localhost:3000/api/me", {
                    credentials: "include"
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserData({
                        name: data.user?.name || data.user?.full_name || "",
                        email: data.user?.email || "",
                        mobile_number: data.user?.mobile_number || data.user?.phone || ""
                    });
                }
            } catch (err) {
                console.error("Error fetching user data:", err);
            } finally {
                setLoadingUser(false);
            }
        };
        fetchUserData();
    }, []);

    // --- LOGIC: CALCULATION ---
    useEffect(() => {
        const calculatedTip = amount * 0.08;
        setTip(calculatedTip);
        setTotal(amount + calculatedTip);
    }, [amount]);

    const handleQuickAmount = (val) => setAmount(val);

    // --- NEW: HANDLE SUBMISSION ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch(`http://localhost:3000/api/donate/${ngoId}/${name_fund}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    your_amount: amount, // Backend expects 'your_amount'
                    pan: pan,
                    full_name: userData.name,
                    email: userData.email,
                    phone: userData.mobile_number
                }),
                credentials: 'include' // Important for session/JWT access
            });

            const result = await response.json();

            if (response.ok) {
                window.alert("Donation Successful! Thank you for your contribution.");
                
                // Wait 3 seconds then redirect to dashboard
                setTimeout(() => {
                    navigate('/'); // Or a specific success page
                }, 2000);
            } else {
                window.alert(`Error: ${result.message || "Failed to process donation"}`);
            }
        } catch (error) {
            console.error("Submission error:", error);
            window.alert("A network error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.pageWrapper}>
            <Header />

            <main className={styles.mainContainer}>
                <h2 className={styles.fundraiserTitle}>
                    Donating to <span className={styles.highlight}>{name_fund}</span>
                </h2>

                {/* Updated to use onSubmit instead of action/method */}
                <form className={styles.donationForm} onSubmit={handleSubmit}>
                    
                    <div className={styles.gridContainer}>
                        
                        <div className={styles.detailsColumn}>
                            {/* SECTION: DONATION AMOUNT */}
                            <div className={styles.glassCard}>
                                <h2 className={styles.cardHeading}>Donation Amount</h2>
                                <div className={styles.popularOptions}>
                                    {[1000, 2000, 3000].map((val) => (
                                        <button 
                                            key={val}
                                            type="button" 
                                            className={amount === val ? styles.optionBtnActive : styles.optionBtn}
                                            onClick={() => handleQuickAmount(val)}
                                        >
                                            ₹{val}
                                        </button>
                                    ))}
                                </div>

                                <div className={styles.amountInputWrapper}>
                                    <span className={styles.currency}>₹</span>
                                    <input 
                                        type="number" 
                                        name="your_amount"
                                        placeholder="Enter custom amount" 
                                        min="1" 
                                        max="100000"
                                        value={amount || ""}
                                        onChange={(e) => setAmount(Number(e.target.value))}
                                        required 
                                        className={styles.mainInput}
                                    />
                                </div>
                            </div>

                            {/* SECTION: YOUR DETAILS */}
                            <div className={styles.glassCard}>
                                <h2 className={styles.cardHeading}>Your Details</h2>
                                <div className={styles.formGroup}>
                                    <label>Full Name</label>
                                    <input 
                                        type="text" 
                                        value={userData.name} 
                                        onChange={(e) => setUserData({...userData, name: e.target.value})}
                                        required 
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Phone Number</label>
                                    <input 
                                        type="tel" 
                                        pattern="[0-9]{10}" 
                                        value={userData.mobile_number}
                                        onChange={(e) => setUserData({...userData, mobile_number: e.target.value})}
                                        required 
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>PAN Number</label>
                                    <input 
                                        type="text" 
                                        pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}" 
                                        placeholder="ABCDE1234F"
                                        onChange={(e) => setPan(e.target.value.toUpperCase())}
                                        value={pan}
                                        required 
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    className={styles.donateBtn}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Processing..." : `Donate Now ₹${total.toFixed(2)}`}
                                </button>
                                <p className={styles.secureNote}>🔒 All payments are securely processed</p>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: LIVE INVOICE */}
                        <div className={styles.invoiceColumn}>
                            <div className={styles.invoiceSticky}>
                                <div className={styles.invoiceCard}>
                                    <h3 className={styles.invoiceTitle}>Summary</h3>
                                    <p className={styles.fundName}>{name_fund}</p>
                                    <div className={styles.invoiceRow}>
                                        <span>Donation Amount</span>
                                        <span>₹{amount.toFixed(2)}</span>
                                    </div>
                                    <div className={styles.invoiceRow}>
                                        <span>Platform Tip (8%)</span>
                                        <span>₹{tip.toFixed(2)}</span>
                                    </div>
                                    <div className={styles.divider}></div>
                                    <div className={`${styles.invoiceRow} ${styles.totalRow}`}>
                                        <span>Total Amount</span>
                                        <span>₹{total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </main>
            <Footer />
        </div>
    );
};

export default DonateFundraiser;