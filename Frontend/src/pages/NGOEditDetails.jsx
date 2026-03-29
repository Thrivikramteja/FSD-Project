import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ErrorFace from '../components/ErrorFace';
import styles from '../styles/NGOEdit.module.css';

const NGOEditDetails = () => {
    const { ngoID } = useParams();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        fullname: '', 
        phone: '', 
        bank: '', 
        accnum: '', 
        ifsc: '', 
        darpan: ''
    });
    const [pageError, setPageError] = useState(null);
    const [status, setStatus] = useState({ type: '', msg: '' });

            useEffect(() => {
                const fetchDetails = async () => {
                    try {
                        const res = await fetch(`http://localhost:3000/api/NGO-dashboard/${ngoID}/details`, {
                            method: 'GET',
                            credentials: 'include', 
                            headers: { 'Content-Type': 'application/json' }
                        });
                        
                        const data = await res.json();
                        console.log("Full API Response:", data);
                        console.log("NGO Object:", data.ngo);    

                        if (data.success) {
                            setFormData({
                                fullname: data.ngo.Ngoname || '',
                                phone: data.ngo.phone || '',
                                bank: data.ngo.account_holder_name || '',
                                accnum: data.ngo.account_number || '',
                                ifsc: data.ngo.ifsc || '',
                                darpan: data.ngo.darpan_id || ''
                            });
                        } else {
                            setPageError(data.message || "Failed to parse NGO data");
                        }
                    } catch (err) {
                        console.error("Fetch Error:", err);
                        setPageError("Server connection lost.");
                    }
                };
                fetchDetails();
            }, [ngoID]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:3000/api/NGO-dashboard/${ngoID}/edit`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await res.json();
            if (result.success) {
                setStatus({ type: 'success', msg: 'Details updated successfully!' });
                setTimeout(() => navigate(`/NGO-dashboard/${ngoID}`), 1500);
            } else {
                setStatus({ type: 'error', msg: result.message });
            }
        } catch (err) {
            setStatus({ type: 'error', msg: 'Network failure. Changes not saved.' });
        }
    };

    if (pageError) return <ErrorFace message={pageError} />;

    return (
        <div className={styles.glassContainer}>
            <div className={styles.glassCard}>
                <h2 className={styles.title}>NGO Configuration</h2>
                
                {status.msg && (
                    <div className={`${styles.alert} ${status.type === 'success' ? styles.success : styles.error}`}>
                        {status.msg}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label>NGO Official Name</label>
                        <input 
                            type="text" 
                            value={formData.fullname} 
                            onChange={(e) => setFormData({...formData, fullname: e.target.value})} 
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Contact Phone</label>
                        <input 
                            type="text" 
                            value={formData.phone} 
                            onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                        />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.inputGroup}>
                            <label>Account Holder</label>
                            <input 
                                type="text" 
                                value={formData.bank} 
                                onChange={(e) => setFormData({...formData, bank: e.target.value})} 
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Account No.</label>
                            <input 
                                type="text" 
                                value={formData.accnum} 
                                onChange={(e) => setFormData({...formData, accnum: e.target.value})} 
                            />
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.inputGroup}>
                            <label>IFSC Code</label>
                            <input 
                                type="text" 
                                value={formData.ifsc} 
                                onChange={(e) => setFormData({...formData, ifsc: e.target.value})} 
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Darpan ID</label>
                            <input 
                                type="text" 
                                value={formData.darpan} 
                                onChange={(e) => setFormData({...formData, darpan: e.target.value})} 
                            />
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="submit" className={styles.updateBtn}>Save Changes</button>
                        <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NGOEditDetails;