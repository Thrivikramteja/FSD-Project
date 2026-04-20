import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styles from '../styles/createEvent.module.css'; // Updated to module

const CreateEvent = () => {
  const { ngoID } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    event_name: '',
    description: '',
    event_location: '',
    event_time: '',
    deadline: '' 
  });

  const [imageFile, setImageFile] = useState(null);
  const [dateError, setDateError] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'deadline') setDateError(false);
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 

    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const inputDate = new Date(formData.deadline);

    if (isNaN(inputDate) || inputDate < today) {
      setDateError(true); 
      return; 
    }

    const dataToSend = new FormData();
    dataToSend.append('id_NGO', ngoID);
    dataToSend.append('userRole', 'NGO'); 
    dataToSend.append('type', 'event');  
    dataToSend.append('event_name', formData.event_name);
    dataToSend.append('description', formData.description);
    dataToSend.append('event_location', formData.event_location);
    dataToSend.append('event_time', formData.event_time);
    dataToSend.append('deadline', formData.deadline);
    dataToSend.append('image', imageFile);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ngo/${ngoID}/create-event`, {
        method: 'POST',
        body: dataToSend,
        credentials: 'include'
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to create event");
      }

      navigate(`/NGO-dashboard/${ngoID}`);

    } catch (err) {
      setError(err.message || "Failed to create event.");
      setTimeout(() => {
        navigate(`/error`);
      }, 5000);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.formContainer}>
        <div className={styles.headerBox}>
          <Link to={`/NGO-dashboard/${ngoID}`} className={styles.backLink}>← Back</Link>
          <h2 className={styles.heading}>Create New Event</h2>
          <p className={styles.subHeading}>Organize a community gathering or fundraiser event</p>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.eventForm}>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Event Title</label>
            <input 
              type="text" 
              name="event_name" 
              placeholder="e.g. Annual Charity Gala"
              className={styles.input}
              value={formData.event_name} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Description</label>
            <textarea 
              name="description" 
              placeholder="Tell donors what this event is about..."
              className={styles.textarea}
              value={formData.description} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Location</label>
              <input 
                type="text" 
                name="event_location" 
                placeholder="City Hall, NY"
                className={styles.input}
                value={formData.event_location} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Time</label>
              <input 
                type="text" 
                name="event_time" 
                placeholder="10:00 AM - 4:00 PM"
                className={styles.input}
                value={formData.event_time} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Event Date</label>
            <input 
              type="date" 
              name="deadline" 
              className={styles.input}
              value={formData.deadline} 
              onChange={handleChange} 
              required 
            />
            {dateError && (
              <span className={styles.fieldError}>
                Date must be today or in the future.
              </span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Event Banner Image</label>
            <div className={styles.fileInputWrapper}>
              <input 
                type="file" 
                name="image" 
                accept="image/*" 
                className={styles.fileInput}
                onChange={handleFileChange} 
                required 
              />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn}>
            Launch Event
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;