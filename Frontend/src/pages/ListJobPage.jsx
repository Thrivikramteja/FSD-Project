import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../components/authContext';

import Footer from '../components/footer';
import PremiumTitle from '../components/PremiumTitle'; 
import styles from '../styles/ListJob.module.css'; 
import ApplyModal from '../pages/ApplyModal'; 

const ListJobPage = () => {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext); 
  const user = auth?.user;
  const userRole = auth?.role;

  const [allJobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- UPDATED STATE: Managing search and filters via State ---
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);

  const [selectedJob, setSelectedJob] = useState(null); 
  const [isApplying, setIsApplying] = useState(false);

  // --- OPTIMIZED FETCH: Triggers whenever search or filters change ---
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append("q", searchTerm);
        
        // Convert the array to a comma-separated string for the backend
        if (selectedTypes.length > 0) {
          params.append("types", selectedTypes.join(','));
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs?${params.toString()}`, {
          credentials: 'include' 
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || "Failed to load jobs");
        }

        const data = await response.json();
        // The server now returns exactly what we need, so we set allJobs directly
        setAllJobs(data.jobs || []);

      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError(err.message || "Job fetch failed");
        // Keeping your original error redirect logic
        setTimeout(() => {
          window.location.href = "/error";
        }, 5000);
      } finally {
        setLoading(false);
      }
    };

    // Debounce timer: Waits 400ms after you stop typing before hitting the server
    const debounceTimer = setTimeout(fetchJobs, 400);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedTypes]); // Dependencies updated

  // --- UPDATED: No longer needs client-side filter logic since Backend does it ---
  const handleCheckboxChange = (type) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleApplyClick = (job) => {
    if (!auth.user || userRole !== "Donor") {
      alert("Only registered Donors can apply for jobs.");
      return;
    }
    setSelectedJob({ id: job._id, title: job.title, pay: job.pay });
  };

  const handleFinalSubmit = async (formData) => {
    setIsApplying(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/applications/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobId: selectedJob.id,
          ...formData 
        }),
        credentials: 'include'
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Application failed");

      alert("Success! Your application has been sent.");
      setSelectedJob(null); 

    } catch (error) {
      console.error("Apply error:", error);
      alert(error.message || "Server error");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <PremiumTitle />

      {error && (
        <p style={{ color: "red", textAlign: "center" }}>
          Error: {error}
        </p>
      )}

      {/* --- ADDED: Search and Filter UI Section --- */}
      <div className={styles.searchFilterContainer}>
        <div className={styles.filterSection}>
          <button 
            className={styles.filterBtn} 
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          >
            📂 Filter {selectedTypes.length > 0 && `(${selectedTypes.length})`}
          </button>

          {showFilterDropdown && (
            <div className={styles.filterDropdown}>
              <h3>Job Type</h3>
              {['Caretaker', 'Part-time', 'Full-time', 'Other'].map(type => (
                <label key={type} className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={selectedTypes.includes(type)}
                    onChange={() => handleCheckboxChange(type)}
                  />
                  {type}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className={styles.searchSection}>
          <input 
            type="text" 
            className={styles.searchInput}
            placeholder="Search by role or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {selectedJob && (
        <ApplyModal 
          jobTitle={selectedJob.title}
          jobPay={selectedJob.pay}
          onClose={() => setSelectedJob(null)}
          onSubmit={handleFinalSubmit}
          isLoading={isApplying}
        />
      )}

      <main className={styles.mainContent}>
        {loading ? (
          <div className={styles.loader}>Optimizing results...</div>
        ) : allJobs.length === 0 ? (
          <div className={styles.noResults}>No jobs match your search/filters.</div>
        ) : (
          <div className={styles.gridContainer}>
            {/* MAPPING over allJobs because server already filtered them */}
            {allJobs.map(job => (
              <div className={styles.jobCard} key={job._id}>
                <div className={styles.cardHeader}>
                  <span className={styles.typeBadge}>{job.type}</span>
                  <span className={styles.salaryBadge}>₹{job.pay || 'Negotiable'}</span>
                </div>

                <h3 className={styles.jobTitle}>{job.title}</h3>

                <p className={styles.jobDescription}>
                  {job.description?.length > 110 ? job.description.substring(0, 110) + "..." : job.description}
                </p>

                <div className={styles.cardFooter}>
                  <button className={styles.applyBtn} onClick={() => handleApplyClick(job)}>
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ListJobPage;