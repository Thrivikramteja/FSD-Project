import { apiFetch } from "../services/api";
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Footer from '../components/footer';
import styles from '../styles/createFundraiser.module.css'; // New Module

const CreateFundraiser = () => {
  const { ngoID } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    id_carehome: 'None',
    fundraiser_name: '',
    description: '',
    goal_amount: '',
    deadline: '',
    tag: 'General'
  });

  const [imageFile, setImageFile] = useState(null);
  const [carehomes, setCarehomes] = useState([]); 
  const [errors, setErrors] = useState({ carehome: false, goal: false, date: false });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCarehomes = async () => {
      try {
        const res = await apiFetch(`/api/carehomes-list`);
        if (!res.ok) throw new Error("Failed to load carehomes");
        const data = await res.json();
        setCarehomes(data);
      } catch (err) {
        setError(err.message);
        setTimeout(() => navigate("/error"), 5000);
      }
    };
    fetchCarehomes();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: false });
  };

  const handleFileChange = (e) => setImageFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = { carehome: false, goal: false, date: false };
    let hasError = false;

    if (parseInt(formData.goal_amount, 10) < 100000) { newErrors.goal = true; hasError = true; }
    if (formData.id_carehome === "None" || !formData.id_carehome) { newErrors.carehome = true; hasError = true; }
    if (new Date(formData.deadline) < new Date().setHours(0,0,0,0)) { newErrors.date = true; hasError = true; }

    setErrors(newErrors);
    if (hasError) return;

    const dataToSend = new FormData();
    Object.keys(formData).forEach(key => dataToSend.append(key, formData[key]));
    dataToSend.append('id_NGO', ngoID);
    dataToSend.append('userRole', 'NGO');
    dataToSend.append('type', 'fundraiser');
    dataToSend.append('image', imageFile);

    try {
      const response = await apiFetch(`/api/ngo-dashboard/${ngoID}/create-fundraiser`, {
        method: 'POST',
        body: dataToSend,
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to create fundraiser");
      navigate(`/ngo-dashboard/${ngoID}`);
    } catch (err) {
      setError(err.message);
      setTimeout(() => navigate("/error"), 5000);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.formContainer}>
        <div className={styles.headerBox}>
          <Link to={`/ngo-dashboard/${ngoID}`} className={styles.backLink}>← Back to Dashboard</Link>
          <h2 className={styles.heading}>Start a Fundraiser</h2>
          <p className={styles.subHeading}>Set a goal and help a care home in need</p>
        </div>

        {error && <div className={styles.errorBanner}><strong>Error:</strong> {error}</div>}

        <form onSubmit={handleSubmit} className={styles.fundraiserForm}>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Select Beneficiary Care Home</label>
            <select 
              name="id_carehome"
              className={styles.select}
              value={formData.id_carehome}
              onChange={handleChange}
            >
              <option value="None">-- Select a Care Home --</option>
              {carehomes.map(home => (
                <option key={home.carehomeId} value={home.carehomeId}>{home.care_home_name}</option>
              ))}
            </select>
            {errors.carehome && <span className={styles.fieldError}>Please select a beneficiary care home.</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Campaign Title</label>
            <input 
              type="text" name="fundraiser_name" 
              placeholder="e.g. Winter Clothes for Sunshine Home"
              className={styles.input}
              value={formData.fundraiser_name}
              onChange={handleChange} required 
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Description & Impact</label>
            <textarea 
              name="description" 
              placeholder="Describe how the funds will be used..."
              className={styles.textarea}
              value={formData.description}
              onChange={handleChange} required 
            />
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Goal Amount (₹)</label>
              <input 
                type="number" name="goal_amount" 
                placeholder="Min. 1,00,000"
                className={styles.input}
                value={formData.goal_amount}
                onChange={handleChange} required 
              />
              {errors.goal && <span className={styles.fieldError}>Minimum goal is ₹1,00,000.</span>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Category Tag</label>
              <select name="tag" className={styles.select} value={formData.tag} onChange={handleChange}>
                <option value="Health">Health</option>
                <option value="Education">Education</option>
                <option value="General">General</option>
                <option value="Emergency">Emergency</option>
                <option value="Environment">Environment</option>
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>End Date</label>
              <input 
                type="date" name="deadline" 
                className={styles.input}
                value={formData.deadline}
                onChange={handleChange} required 
              />
              {errors.date && <span className={styles.fieldError}>Select a valid future date.</span>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Campaign Banner</label>
              <input 
                type="file" name="image" 
                accept="image/*"
                className={styles.fileInput}
                onChange={handleFileChange} required 
              />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn}>Launch Campaign</button>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default CreateFundraiser;