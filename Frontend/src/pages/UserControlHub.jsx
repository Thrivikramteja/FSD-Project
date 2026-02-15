import React, { useState } from 'react';
import DonorControl from './DonorControl';
import NgoControl from './NgoControl';
import CarehomeControl from './CarehomeControl';
import styles from '../styles/UserControlHub.module.css';

const UserControlHub = () => {
    const [subTab, setSubTab] = useState('donors');
    return (
        <div className={styles.hubWrapper}>

            <div className={styles.subNavBar}>
                <div className={styles.tabGroup}>
                    <button 
                        className={subTab === 'donors' ? styles.activeSub : ''} 
                        onClick={() => setSubTab('donors')}
                    >
                        Donor Management
                    </button>
                    <button 
                        className={subTab === 'ngos' ? styles.activeSub : ''} 
                        onClick={() => setSubTab('ngos')}
                    >
                        NGO Management
                    </button>
                    <button 
                        className={subTab === 'carehomes' ? styles.activeSub : ''} 
                        onClick={() => setSubTab('carehomes')}
                    >
                        Carehome Management
                    </button>
                </div>
                <div className={styles.hubTitle}>
                    <span>Administrative Tier</span>
                    <p>{subTab.toUpperCase()} OVERLOOK</p>
                </div>
            </div>

            <div className={styles.contentStage}>
                {subTab === 'donors' && <DonorControl />}
                {subTab === 'ngos' && <NgoControl />}
                {subTab === 'carehomes' && <CarehomeControl />}
            </div>
        </div>
    );
};

export default UserControlHub;