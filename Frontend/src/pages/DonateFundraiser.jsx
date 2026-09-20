import { apiFetch } from "../services/api";
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Header from '../components/header';
import Footer from '../components/footer';
import styles from '../styles/DonateFundraiser.module.css';

/**
 * DonateFundraiser.jsx
 *
 * Feature-flagged fundraiser donation page.
 *
 * VITE_CASHFREE_ENABLED=false (default):
 *   — Existing direct-POST flow unchanged.
 *   — Posts to /api/donate/:ngoId/:fundraiser_name.
 *   — Shows alert on success.
 *
 * VITE_CASHFREE_ENABLED=true:
 *   — Calls /api/payment/initiate to get a Cashfree payment_session_id.
 *   — Loads @cashfreepayments/cashfree-js SDK dynamically.
 *   — Invokes cashfree.checkout() which redirects user to Cashfree hosted checkout.
 *   — On return, Cashfree redirects to /payment/result?order_id=...
 *   — PaymentResult.jsx polls backend for confirmed status.
 *   — This page does NOT show "Donation Successful" immediately.
 *
 * Security:
 *   — Frontend sends only donationAmount (the intended fundraiser contribution).
 *   — Backend computes platformTip (8%) and totalAmount server-side.
 *   — Frontend-displayed tip and total are for display only; they have no effect
 *     on what is actually charged (the backend authoritative values are used).
 */

const CASHFREE_ENABLED = import.meta.env.VITE_CASHFREE_ENABLED === 'true';

const DonateFundraiser = () => {
    const { ngoId, name_fund } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const fundraiserId = location.state?.fundraiserId || searchParams.get('id');
    
    const [userData, setUserData] = useState({
        name: "", 
        email: "",
        mobile_number: "" 
    });

    const [amount, setAmount] = useState(0);
    const [tip, setTip] = useState(0);
    const [total, setTotal] = useState(0);
    const [pan, setPan] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await apiFetch(`/api/me`, {
                    credentials: "include"
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.message || "Failed to fetch user data");
                }

                const data = await response.json();
                setUserData({
                    name: data.user?.name || data.user?.full_name || "",
                    email: data.user?.email || "",
                    mobile_number: data.user?.mobile_number || data.user?.phone || ""
                });
            } catch (err) {
                console.error("Error fetching user data:", err);

                setError(err.message || "Failed to load user data");

                setTimeout(() => {
                    window.location.href = "/error";
                }, 5000);
            }
        };
        fetchUserData();
    }, []);

    // Display-only tip calculation (never sent to backend — backend computes authoritatively)
    useEffect(() => {
        const calculatedTip = Math.round(amount * 8) / 100;
        setTip(calculatedTip);
        setTotal(amount + calculatedTip);
    }, [amount]);

    const handleQuickAmount = (val) => setAmount(val);

    // ── Legacy flow (CASHFREE_ENABLED=false) ──────────────────────────────────
    const handleLegacySubmit = async () => {
        const response = await apiFetch(`/api/donate/${ngoId}/${name_fund}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fundraiserId: fundraiserId,
                your_amount: amount,
                pan: pan,
                full_name: userData.name,
                email: userData.email,
                phone: userData.mobile_number
            }),
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to process donation");
        }

        window.alert("Donation Successful! Thank you for your contribution.");

        setTimeout(() => {
            navigate('/');
        }, 2000);
    };

    // ── Cashfree flow (CASHFREE_ENABLED=true) ─────────────────────────────────
    const handleCashfreeSubmit = async () => {
        // Step 1: Call backend to create PENDING transaction and Cashfree order.
        // Frontend sends only the donation amount — tip and total are computed by backend.
        const initiateRes = await apiFetch('/api/payment/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fundraiserId: fundraiserId,
                ngoId,
                fundraiser_name: name_fund,
                donationAmount: amount,
            }),
            credentials: 'include',
        });

        const initiateData = await initiateRes.json();

        if (!initiateRes.ok) {
            throw new Error(initiateData.message || 'Failed to initiate payment');
        }

        const { paymentSessionId } = initiateData;

        // Step 2: Load Cashfree JS SDK dynamically (sandbox mode)
        const cashfreeModule = await import('@cashfreepayments/cashfree-js');
        const cashfree = await cashfreeModule.load({ mode: 'sandbox' });

        // Step 3: Open Cashfree hosted checkout
        // This redirects the user to Cashfree's payment page.
        // On completion, Cashfree redirects to the return_url configured by the backend
        // (/payment/result?order_id=...).
        // Do NOT show "Donation Successful" here — wait for PaymentResult.jsx confirmation.
        const checkoutResult = await cashfree.checkout({
            paymentSessionId,
            redirectTarget: '_self',
        });

        // If checkout() returns (some flows return instead of redirecting),
        // navigate to result page so backend confirmation happens regardless.
        if (checkoutResult && checkoutResult.error) {
            throw new Error(checkoutResult.error.message || 'Payment checkout failed');
        }
        // For redirect flows, execution stops here (page navigates away).
        // For non-redirect flows, navigate manually.
        navigate(`/payment/result?order_id=${initiateData.ccOrderId}`);
    };

    // ── Unified submit handler ─────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!amount || amount < 1) {
            setError('Please enter a valid donation amount');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            if (CASHFREE_ENABLED) {
                await handleCashfreeSubmit();
            } else {
                await handleLegacySubmit();
            }
        } catch (err) {
            console.error("Submission error:", err);

            setError(err.message || "Network error occurred");

            // Only redirect on fatal errors — payment gateway errors should stay on page
            if (!CASHFREE_ENABLED) {
                setTimeout(() => {
                    window.location.href = "/error";
                }, 5000);
            }
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

                {error && (
                    <p style={{ color: "red", textAlign: "center" }}>
                        Error: {error}
                    </p>
                )}

                <form className={styles.donationForm} onSubmit={handleSubmit}>
                    <div className={styles.gridContainer}>
                        
                        <div className={styles.detailsColumn}>
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
                                    {isSubmitting
                                        ? "Processing..."
                                        : CASHFREE_ENABLED
                                            ? `Pay ₹${total.toFixed(2)} Securely`
                                            : `Donate Now ₹${total.toFixed(2)}`
                                    }
                                </button>

                                <p className={styles.secureNote}>🔒 All payments are securely processed</p>
                            </div>
                        </div>

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
                                    {CASHFREE_ENABLED && (
                                        <p style={{
                                            fontSize: '11px',
                                            color: '#6B7280',
                                            marginTop: '8px',
                                            lineHeight: '1.4',
                                        }}>
                                            * Fundraiser receives ₹{amount.toFixed(2)}.
                                            The ₹{tip.toFixed(2)} tip supports the platform.
                                        </p>
                                    )}
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
