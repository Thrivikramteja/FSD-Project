import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Footer from '../components/footer';
import '../styles/list_job.css'; // Import the namespaced CSS

const ListJobPage = () => {
  const navigate = useNavigate();
  
  // 1. STATE MANAGEMENT
  const [allJobs, setAllJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);

  // 2. FETCH JOBS ON LOAD
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        // Assuming your backend route is /jobs/all
        const response = await fetch('http://localhost:3000/jobs/all', {
            credentials: 'include' 
        });
        const data = await response.json();
        const jobs = data.jobs || [];
        setAllJobs(jobs);
        setFilteredJobs(jobs);
      } catch (err) {
        console.error('Error fetching jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // 3. FILTER & SEARCH LOGIC
  const handleSearch = () => {
    applyFilters();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleCheckboxChange = (e) => {
    const value = e.target.value;
    if (e.target.checked) {
      setSelectedTypes([...selectedTypes, value]);
    } else {
      setSelectedTypes(selectedTypes.filter(type => type !== value));
    }
  };

  const applyFilters = () => {
    let result = allJobs;

    // Apply Search
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(job => 
        job.title.toLowerCase().includes(lowerTerm) ||
        (job.description && job.description.toLowerCase().includes(lowerTerm)) ||
        (job.location && job.location.toLowerCase().includes(lowerTerm))
      );
    }

    // Apply Checkbox Filters
    if (selectedTypes.length > 0) {
      result = result.filter(job => 
        selectedTypes.includes(job.type.toLowerCase())
      );
    }

    setFilteredJobs(result);
    setShowFilterDropdown(false); // Close dropdown
  };

  // 4. APPLY BUTTON HANDLER
  const handleApply = (jobId) => {
    // You can add logic here to check if user is a Donor before navigating
    // For now, straightforward navigation:
    // navigate(`/jobs/apply/${jobId}`);
    alert(`Apply feature clicked for job ${jobId} (Implement Route later)`);
  };

  return (
    <div className="list-job-page">
      

      {/* Header Section (from your EJS layout logic) */}
      <div className="header-section">
        <div className="header-content">
            <div className="title-badge">
                <span className="badge-icon">💼</span>
                <h1>Available Job Opportunities</h1>
            </div>
            <p className="subtitle">Find meaningful work with care homes near you</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="search-filter-container">
        
        {/* Filter Button & Dropdown */}
        <div className="filter-section">
          <button 
            className="filter-btn" 
            id="filterBtn"
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          >
            <span>Filters</span>
          </button>
          
          {showFilterDropdown && (
            <div className="filter-dropdown show" id="filterDropdown">
              <h3>Filter by Type</h3>
              {['full-time', 'part-time', 'caretaker', 'others'].map(type => (
                <label className="checkbox-label" key={type}>
                  <input 
                    type="checkbox" 
                    value={type} 
                    className="filter-checkbox"
                    onChange={handleCheckboxChange}
                    checked={selectedTypes.includes(type)}
                  />
                  <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                </label>
              ))}
              <button 
                className="apply-filter-btn" 
                id="applyFilterBtn"
                onClick={applyFilters}
              >
                Apply Filters
              </button>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="search-section">
          <input 
            type="text" 
            id="searchInput" 
            placeholder="Search for jobs by title, location, or description..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className="search-btn" id="searchBtn" onClick={handleSearch}>
            Search
          </button>
        </div>
      </div>

      {/* Job Grid */}
      <div className="grid-container" id="jobsContainer">
        {loading ? (
          <p>Loading jobs...</p>
        ) : filteredJobs.length === 0 ? (
          <p>No jobs available at the moment.</p>
        ) : (
          filteredJobs.map(job => (
            <div className="card" key={job._id}>
              <div className="title">{job.title}</div>
              <div className="content">
                <p>{job.description}</p>
                <p><strong>Location:</strong> {job.location || 'Not specified'}</p>
                <p><strong>Pay:</strong> {job.pay || 'Can be discussed'}</p>
                <p><strong>Type:</strong> {job.type}</p>
                <button onClick={() => handleApply(job._id)}>Apply</button>
              </div>
            </div>
          ))
        )}
      </div>

     <Footer></Footer>
    </div>
  );
};

export default ListJobPage;