import React, { useState } from 'react';
import styles from '../styles/OtpVerification.module.css';

const ForgotPassword = ({ onClose, onEmailSubmit, isLoading, serverError }) => {
  const [data, setData] = useState({ email: "", userRole: "Donor" });

  const handleSubmit = (e) => {
    e.preventDefault();
    onEmailSubmit(data.email, data.userRole);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.iconContainer} style={{ background: '#ecfdf5', color: '#10b981' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3y-3z"></path>
          </svg>
        </div>
        
        <h2 className={styles.title}>Password Recovery</h2>
        <p className={styles.subtitle}>Enter your details to receive a secure reset code.</p>

        {serverError && <div className={styles.errorBanner} style={{ color: '#ef4444', background: '#fef2f2', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '15px' }}>{serverError}</div>}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '15px' }}>
             <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase' }}>User Role</label>
             <select 
               className={styles.otpInput} 
               style={{ width: '100%', height: '48px', fontSize: '15px', marginTop: '6px', padding: '0 12px', border: '2px solid #e5e7eb', borderRadius: '12px' }}
               value={data.userRole}
               onChange={(e) => setData({...data, userRole: e.target.value})}
             >
               <option value="Donor">Donor</option>
               <option value="NGO">NGO</option>
               <option value="Carehome">Carehome</option>
             </select>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase' }}>Email Address</label>
            <input 
              type="email" 
              className={styles.otpInput} 
              style={{ width: '100%', height: '48px', fontSize: '15px', marginTop: '6px', padding: '0 12px', border: '2px solid #e5e7eb', borderRadius: '12px' }}
              placeholder="e.g. name@iiits.in"
              required
              value={data.email}
              onChange={(e) => setData({...data, email: e.target.value})}
            />
          </div>

          <button type="submit" className={styles.submitBtn} style={{ background: '#10b981', width: '100%', padding: '14px', borderRadius: '12px', color: 'white', fontWeight: '700', border: 'none', cursor: 'pointer' }} disabled={isLoading}>
            {isLoading ? "Verifying Email..." : "Send Reset Code"}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
              Cancel and go back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;