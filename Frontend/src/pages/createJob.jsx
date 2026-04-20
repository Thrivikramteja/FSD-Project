import React, { useState } from 'react';

const jobTypes = [
"Caretaker",
"Part-time",
"Full-time",
"Other"
];

const CreateJob = () => {
const [formData, setFormData] = useState({
title: '',
description: '',
location: '',
pay: '', 
type: '',
startDate: '',
endDate: ''
});

const [isPosting, setIsPosting] = useState(false);
const [message, setMessage] = useState("Posting the job...");
const [isSuccess, setIsSuccess] = useState(null);
const [error, setError] = useState(null); // NEW

const handleChange = (e) => {
const { name, value } = e.target;
setFormData(prevData => ({
...prevData,
[name]: value
}));
};

const handleSubmit = async (e) => {
e.preventDefault();

if (!formData.title || !formData.description || !formData.type) {
alert("Please fill in the Job Title, Description, and Job Type.");
return;
}

const { startDate, endDate } = formData;
if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
alert("The Start Date cannot be after the End Date.");
return;
}

setIsPosting(true);
setMessage("Posting the job...");
setIsSuccess(null);
setError(null);

const dataToSend = {
...formData,
pay: formData.pay ? parseFloat(formData.pay) : null, 
};

try {
const response = await fetch(`https://fsd-project-backend-2bms.onrender.com/carehome-dashboard/post-job`, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(dataToSend),
credentials: "include"
});

const result = await response.json().catch(() => ({})); 

if (!response.ok) {
throw new Error(result.message || `Server returned status ${response.status}`);
}

if (result.success) {
setMessage("Job Posted Successfully!");
setIsSuccess(true);

setTimeout(() => {
window.location.href = result.redirectUrl || '/carehome-dashboard';
}, 1500);

} else {
throw new Error(result.message || "Failed to create job");
}

} catch (err) {
console.error("Fetch error:", err);

setError(err.message || "Network error occurred");
setMessage(err.message || "Network error occurred");
setIsSuccess(false);
setIsPosting(false);

// Redirect after 5 seconds
setTimeout(() => {
window.location.href = "/error";
}, 5000);
}
};

return (
<div className="container">
<div className="card">

<div className="card-image">
<h2 className="card-heading">Post a New Job</h2>
<small style={{ display: 'block', marginBottom: '15px' }}>
Fill in the details for the job
</small>
</div>

{error && (
<p style={{ color: "red", textAlign: "center" }}>
Error: {error}
</p>
)}

<form className="card-form" onSubmit={handleSubmit}>

<div className="input">
<label htmlFor="title" className="input-label" style={{ position: 'static', transform: 'none' }}>Job Title</label>
<input 
id="title"
type="text" 
className="input-field" 
name="title" 
value={formData.title}
onChange={handleChange}
required 
/>
</div>

<div className="input">
<label htmlFor="description" className="input-label" style={{ position: 'static', transform: 'none' }}>Job Description</label>
<textarea 
id="description"
className="input-field" 
name="description" 
value={formData.description}
onChange={handleChange}
required
></textarea>
</div>

<div className="input">
<label htmlFor="location" className="input-label" style={{ position: 'static', transform: 'none' }}>Location</label>
<input 
id="location"
type="text" 
className="input-field" 
name="location"
value={formData.location}
onChange={handleChange}
/>
</div>

<div className="input">
<label htmlFor="pay" className="input-label" style={{ position: 'static', transform: 'none' }}>Pay</label>
<input 
id="pay"
type="number" 
className="input-field" 
name="pay" 
step="0.01"
value={formData.pay} 
onChange={handleChange}
/>
</div>

<div className="input">
<label htmlFor="type" className="input-label" style={{ position: 'static', transform: 'none' }}>Job Type</label>
<select 
id="type"
className="input-field" 
name="type" 
value={formData.type}
onChange={handleChange}
required
>
<option value="" disabled hidden>Select Type</option>
{jobTypes.map(type => (
<option key={type} value={type}>{type}</option>
))}
</select>
</div>

<div className="input">
<label htmlFor="startDate" className="input-label" style={{ position: 'static', transform: 'none' }}>Start Date</label>
<input 
id="startDate"
type="date" 
className="input-field" 
name="startDate"
value={formData.startDate}
onChange={handleChange}
/>
</div>

<div className="input">
<label htmlFor="endDate" className="input-label" style={{ position: 'static', transform: 'none' }}>End Date</label>
<input 
id="endDate"
type="date" 
className="input-field" 
name="endDate"
value={formData.endDate}
onChange={handleChange}
/>
</div>

<div className="action">
<button 
type="submit" 
className="action-button"
disabled={isPosting}
>
{isPosting && isSuccess !== true ? 'Posting...' : 'Post Job'}
</button>
</div>
</form>

<div className={`overlay ${!isPosting ? 'hidden' : ''}`}>
<div className="overlay-content">
{isPosting && isSuccess === null && <div className="spinner"></div>}
{isSuccess === true && <span style={{fontSize: '2em'}}>✅</span>}
{isSuccess === false && <span style={{fontSize: '2em'}}>❌</span>}
<p className="message">{message}</p>
</div>
</div>
</div>
</div>
);
};

export default CreateJob;