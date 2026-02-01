import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Footer from '../components/footer';
import '../styles/ngo_das.css'; 

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

  const [errors, setErrors] = useState({
    carehome: false,
    goal: false,
    date: false
  });

  const [error, setError] = useState(null); // NEW

  useEffect(() => {
    const fetchCarehomes = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/carehomes-list');

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Failed to load carehomes");
        }

        const data = await res.json();
        setCarehomes(data);
      } catch (err) {
        console.error("Failed to load carehomes", err);

        setError(err.message || "Failed to load carehomes");

        setTimeout(() => {
          window.location.href = "/error";
        }, 5000);
      }
    };
    fetchCarehomes();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: false });
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = { carehome: false, goal: false, date: false };
    let hasError = false;

    const goalValue = parseInt(formData.goal_amount, 10);
    if (isNaN(goalValue) || goalValue < 100000) {
      newErrors.goal = true;
      hasError = true;
    }

    if (formData.id_carehome === "None" || formData.id_carehome === "") {
      newErrors.carehome = true;
      hasError = true;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(formData.deadline);
    if (isNaN(inputDate) || inputDate < today) {
      newErrors.date = true;
      hasError = true;
    }

    setErrors(newErrors);
    if (hasError) return;

    const dataToSend = new FormData();
    dataToSend.append('userRole', 'NGO'); 
    dataToSend.append('type', 'fundraiser');
    dataToSend.append('id_NGO', ngoID);
    dataToSend.append('id_carehome', formData.id_carehome);
    dataToSend.append('fundraiser_name', formData.fundraiser_name);
    dataToSend.append('description', formData.description);
    dataToSend.append('goal_amount', formData.goal_amount);
    dataToSend.append('deadline', formData.deadline);
    dataToSend.append('tag', formData.tag);
    dataToSend.append('image', imageFile);

    try {
      const response = await fetch(`http://localhost:3000/api/ngo-dashboard/${ngoID}/create-fundraiser`, {
        method: 'POST',
        body: dataToSend,
        credentials: 'include'
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to create fundraiser");
      }

      navigate(`/ngo-dashboard/${ngoID}`);

    } catch (err) {
      console.error("Submission error:", err);

      setError(err.message || "Failed to create fundraiser.");

      setTimeout(() => {
        window.location.href = "/error";
      }, 5000);
    }
  };

  return (
    <div className="ngo-dashboard-page">
      <div className="form-container">
        <h2 className="head_ing">Create New Fundraiser</h2>

        {error && (
          <p style={{ color: "red", textAlign: "center" }}>
            Error: {error}
          </p>
        )}

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          
          <div className="form-group">
            <label>Please select one care home:</label>
            <select 
              id="val_drop" 
              className="care_select" 
              name="id_carehome"
              value={formData.id_carehome}
              onChange={handleChange}
              autoFocus
            >
              <option value="None">None</option>
              {carehomes.map(home => (
                <option key={home.carehomeId} value={home.carehomeId}>
                  {home.care_home_name}
                </option>
              ))}
            </select>

            {errors.carehome && (
              <span id="val_error" style={{ color: 'red', display: 'block' }}>
                Must select one care home before proceeding
              </span>
            )}
          </div>

          <div className="form-group">
            <label>Title:</label>
            <input 
              type="text" 
              name="fundraiser_name" 
              value={formData.fundraiser_name}
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
            <label>Goal Amount:</label>
            <input 
              type="number" 
              id="goal" 
              name="goal_amount" 
              value={formData.goal_amount}
              onChange={handleChange}
              required 
            />
            {errors.goal && (
              <span id="goalerror" style={{ color: 'red', display: 'block' }}>
                Goal amount must be valid and minimum is 1,00,000
              </span>
            )}
          </div>

          <div className="form-group">
            <label>Deadline:</label>
            <input 
              type="date" 
              id="deadline" 
              name="deadline" 
              value={formData.deadline}
              onChange={handleChange}
              required 
            />
            {errors.date && (
              <span id="dateerror" style={{ color: 'red', display: 'block' }}>
                Deadline must be a valid future date.
              </span>
            )}
          </div>

          <div className="form-group">
            <label>Tag:</label>
            <select 
              id="tag" 
              name="tag" 
              className="tag-select" 
              value={formData.tag}
              onChange={handleChange}
              required
            >
              <option value="Health">Health</option>
              <option value="Education">Education</option>
              <option value="General">General</option>
              <option value="Emergency">Emergency</option>
              <option value="Environment">Environment</option>
              <option value="Animal Welfare">Animal Welfare</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div className="form-group">
            <label>Image:</label>
            <input 
              type="file" 
              id="image" 
              name="image" 
              accept="image/*" 
              onChange={handleFileChange}
              required 
            />
          </div>

          <button type="submit" className="gradient-btn">Create Fundraiser</button>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default CreateFundraiser;
