import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../services/api';
import Header from '../components/header';
import Footer from '../components/footer';

/**
 * PaymentResult.jsx
 *
 * This page is the return_url destination after the Cashfree hosted checkout.
 * It does NOT trust the redirect itself as proof of payment.
 * Instead, it polls the backend GET /api/payment/status/:ccOrderId endpoint
 * to obtain the backend-confirmed payment status.
 *
 * Only when the backend reports SUCCEEDED does this page show "Donation Confirmed".
 */

const POLL_INTERVAL_MS = 3000; // poll every 3 seconds
const MAX_POLLS        = 20;   // give up after 60 seconds

const PaymentResult = () => {
  const [searchParams]   = useSearchParams();
  const navigate          = useNavigate();
  const ccOrderId         = searchParams.get('order_id');

  const [status, setStatus]       = useState('LOADING'); // LOADING | PENDING | SUCCEEDED | FAILED | ERROR
  const [details, setDetails]     = useState(null);
  const [pollCount, setPollCount] = useState(0);
  const intervalRef               = useRef(null);

  // ── Poll backend for confirmed status ─────────────────────────────────────
  useEffect(() => {
    if (!ccOrderId) {
      setStatus('ERROR');
      return;
    }

    const poll = async () => {
      try {
        const res = await apiFetch(`/api/payment/status/${encodeURIComponent(ccOrderId)}`, {
          credentials: 'include',
        });

        if (!res.ok) {
          // 401/403 means unauthenticated — redirect to login
          if (res.status === 401 || res.status === 403) {
            clearInterval(intervalRef.current);
            navigate('/login');
            return;
          }
          // 404 — transaction not found yet; keep polling
          return;
        }

        const data = await res.json();

        setPollCount(c => {
          const next = c + 1;
          if (next >= MAX_POLLS) {
            clearInterval(intervalRef.current);
            setStatus('PENDING'); // timed out — still pending
          }
          return next;
        });

        if (data.status === 'SUCCEEDED') {
          clearInterval(intervalRef.current);
          setStatus('SUCCEEDED');
          setDetails(data);
        } else if (data.status === 'FAILED') {
          clearInterval(intervalRef.current);
          setStatus('FAILED');
          setDetails(data);
        }
        // PENDING → keep polling

      } catch (err) {
        console.error('[PaymentResult] Poll error:', err);
        // Network error — keep polling until MAX_POLLS
      }
    };

    // First poll immediately
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ccOrderId]);

  // ── Styles ─────────────────────────────────────────────────────────────────
  const pageStyle = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
  };

  const cardStyle = {
    background: 'rgba(255,255,255,0.07)',
    backdropFilter: 'blur(18px)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.15)',
    padding: '48px 40px',
    maxWidth: '480px',
    width: '90%',
    margin: '40px auto',
    textAlign: 'center',
    color: '#fff',
    boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
  };

  const iconStyle = (color) => ({
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    fontSize: '32px',
  });

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    fontSize: '14px',
  };

  const btnStyle = (bg) => ({
    display: 'inline-block',
    marginTop: '28px',
    padding: '12px 32px',
    borderRadius: '12px',
    background: bg,
    color: '#fff',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '15px',
    cursor: 'pointer',
    border: 'none',
    transition: 'opacity 0.2s',
  });

  // ── Render states ──────────────────────────────────────────────────────────

  const renderContent = () => {
    switch (status) {

      case 'LOADING':
      case 'PENDING':
        return (
          <>
            <div style={iconStyle('rgba(251,191,36,0.2)')}>⏳</div>
            <h2 style={{ margin: '0 0 12px', fontSize: '22px', fontWeight: '700' }}>
              Confirming Your Payment…
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', margin: '0 0 8px' }}>
              We are verifying your payment with the payment gateway.
              This usually takes a few seconds. Please do not refresh the page.
            </p>
            {status === 'PENDING' && pollCount >= MAX_POLLS && (
              <p style={{ color: '#fbbf24', fontSize: '13px', marginTop: '12px' }}>
                This is taking longer than expected. Your payment is being processed.
                Check your donor dashboard in a few minutes.
              </p>
            )}
            <div style={{ marginTop: '24px' }}>
              <div style={{
                width: '48px', height: '48px',
                border: '4px solid rgba(255,255,255,0.2)',
                borderTop: '4px solid #10b981',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          </>
        );

      case 'SUCCEEDED':
        return (
          <>
            <div style={iconStyle('rgba(16,185,129,0.25)')}>✅</div>
            <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
              Donation Confirmed!
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '28px' }}>
              Thank you for your contribution. Your donation has been successfully processed
              and the fundraiser has been updated.
            </p>
            {details && (
              <div style={{
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'left',
                marginBottom: '8px',
              }}>
                <div style={rowStyle}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Fundraiser</span>
                  <span style={{ fontWeight: '600' }}>{details.fundraiserName}</span>
                </div>
                <div style={rowStyle}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Donation Amount</span>
                  <span style={{ fontWeight: '600' }}>₹{details.donationAmount?.toLocaleString()}</span>
                </div>
                <div style={rowStyle}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Platform Tip (8%)</span>
                  <span style={{ fontWeight: '600', color: '#10b981' }}>+₹{details.platformTip?.toFixed(2)}</span>
                </div>
                <div style={{ ...rowStyle, border: 'none', paddingTop: '10px' }}>
                  <span style={{ color: '#fff', fontWeight: '700' }}>Total Charged</span>
                  <span style={{ color: '#10b981', fontWeight: '700', fontSize: '16px' }}>
                    ₹{details.totalAmount?.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
            <Link to="/" style={btnStyle('linear-gradient(135deg, #10b981, #059669)')}>
              Back to Home
            </Link>
          </>
        );

      case 'FAILED':
        return (
          <>
            <div style={iconStyle('rgba(239,68,68,0.25)')}>❌</div>
            <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
              Payment Failed
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '28px', lineHeight: '1.6' }}>
              Your payment was not completed. No amount has been charged to you and
              no donation has been recorded. You can try again.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                style={btnStyle('linear-gradient(135deg, #ef4444, #dc2626)')}
                onClick={() => navigate(-1)}
              >
                Try Again
              </button>
              <Link to="/" style={btnStyle('rgba(255,255,255,0.12)')}>
                Back to Home
              </Link>
            </div>
          </>
        );

      case 'ERROR':
      default:
        return (
          <>
            <div style={iconStyle('rgba(239,68,68,0.2)')}>⚠️</div>
            <h2 style={{ margin: '0 0 8px', fontSize: '22px' }}>Something went wrong</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: '24px' }}>
              We could not find your payment. Please check your donor dashboard
              or contact support.
            </p>
            <Link to="/" style={btnStyle('rgba(255,255,255,0.12)')}>
              Back to Home
            </Link>
          </>
        );
    }
  };

  return (
    <div style={pageStyle}>
      <Header />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={cardStyle}>
          <p style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.35)',
            marginBottom: '24px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}>
            CareConnect Pay
          </p>
          {renderContent()}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentResult;
