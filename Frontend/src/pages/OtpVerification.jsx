import React, { useState, useRef, useEffect } from 'react';
import styles from "../styles/OtpVerification.module.css";

const OtpVerification = ({ email, onVerifySuccess, onResend, isLoading, errorMsg }) => {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  }, []);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.value !== "" && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && index > 0 && otp[index] === "") {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalOtpCode = otp.join("");
    if (finalOtpCode.length === 6) onVerifySuccess(finalOtpCode);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.iconContainer}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
        </div>
        
        <h2 className={styles.title}>Security Verification</h2>
        <p className={styles.subtitle}>
          Enter the 6-digit code sent to <br/>
          <span className={styles.emailText}>{email}</span>
        </p>

        {errorMsg && <div className={styles.errorBanner}>{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.otpGrid}>
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                maxLength="1"
                className={styles.otpInput}
                ref={el => inputRefs.current[index] = el}
                value={data}
                onChange={e => handleChange(e.target, index)}
                onKeyDown={e => handleKeyDown(e, index)}
              />
            ))}
          </div>

          <button 
            type="submit" 
            className={styles.submitBtn} 
            disabled={otp.join("").length !== 6 || isLoading}
          >
            {isLoading ? "Verifying..." : "Confirm & Login"}
          </button>
        </form>

        <p className={styles.resendText}>
          Didn't get a code? <button onClick={onResend} className={styles.resendBtn}>Resend Email</button>
        </p>
      </div>
    </div>
  );
};

export default OtpVerification;