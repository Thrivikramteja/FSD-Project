import React from 'react';
import styles from '../styles/DonationTicker.module.css';

const DonationTicker = ({ donations }) => {
  // If no data yet, show a placeholder or nothing
  if (!donations || donations.length === 0) return null;

  // We double the list to create a seamless infinite loop
  const displayDonations = [...donations, ...donations];

  return (
    <div className={styles.tickerWrapper}>
      <div className={styles.tickerMove}>
        {displayDonations.map((don, index) => (
          <div key={index} className={styles.tickerItem}>
            <span className={styles.donorName}>{don.name || "Anonymous"}</span>
            <span className={styles.actionText}> donated </span>
            <span className={styles.amount}>₹{don.amount.toLocaleString()}</span>
            
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonationTicker;