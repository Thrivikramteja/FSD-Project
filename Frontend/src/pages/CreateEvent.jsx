import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/ngo_das.css'; 

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
  const [error, setError] = useState(null); // NEW

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
      const response = await fetch(`http://localhost:3000/api/ngo/${ngoID}/create-event`, {
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
      console.error("Error creating event:", err);

      setError(err.message || "Failed to create event.");

      // Redirect after 5 seconds
      setTimeout(() => {
        window.location.href = "/error";
      }, 5000);
    }
  };

  return (
    <div className="ngo-dashboard-page">
      <div className="form-container">
        <h2 className="head_ing">Create New Event</h2>

        {error && (
          <p style={{ color: "red", textAlign: "center" }}>
            Error: {error}
          </p>
        )}

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          
          <div className="form-group">
            <label>Title:</label>
            <input 
              type="text" 
              name="event_name" 
              value={formData.event_name} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Description:</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Location:</label>
            <input 
              type="text" 
              name="event_location" 
              value={formData.event_location} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Time:</label>
            <input 
              type="text" 
              name="event_time" 
              value={formData.event_time} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Date:</label>
            <input 
              type="date" 
              name="deadline" 
              value={formData.deadline} 
              onChange={handleChange} 
              required 
            />
            {dateError && (
              <span id="dateerror" style={{ color: 'red', display: 'block' }}>
                Date must be valid ({'>'}=today)
              </span>
            )}
          </div>

          <div className="form-group">
            <label>Image:</label>
            <input 
              type="file" 
              name="image" 
              accept="image/*" 
              onChange={handleFileChange} 
              required 
            />
          </div>

          <button type="submit" className="gradient-btn">Create Event</button>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;
