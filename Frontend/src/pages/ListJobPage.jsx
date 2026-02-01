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
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // NEW
  
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);

  const [selectedJob, setSelectedJob] = useState(null); 
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/jobs', {
          credentials: 'include' 
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || "Failed to load jobs");
        }

        const data = await response.json();
        const jobs = data.jobs || [];
        setAllJobs(jobs);
        setFilteredJobs(jobs);

      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError(err.message || "Job fetch failed");

        setTimeout(() => {
          window.location.href = "/error";
        }, 5000);

      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const applyFilters = () => {
    let result = allJobs;

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(job => 
        job.title.toLowerCase().includes(lowerTerm) ||
        (job.description && job.description.toLowerCase().includes(lowerTerm)) ||
        (job.location && job.location.toLowerCase().includes(lowerTerm))
      );
    }

    if (selectedTypes.length > 0) {
      result = result.filter(job => 
        selectedTypes.includes(job.type.toLowerCase())
      );
    }

    setFilteredJobs(result);
    setShowFilterDropdown(false); 
  };

  const handleSearch = () => applyFilters();
  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(); };

  const handleCheckboxChange = (e) => {
    const value = e.target.value;
    if (e.target.checked) {
      setSelectedTypes([...selectedTypes, value]);
    } else {
      setSelectedTypes(selectedTypes.filter(type => type !== value));
    }
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
      const response = await fetch(`http://localhost:3000/api/applications/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobId: selectedJob.id,
          ...formData 
        }),
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Application failed");
      }

      alert("Success! Your application has been sent.");
      setSelectedJob(null); 

    } catch (error) {
      console.error("Apply error:", error);
      alert(error.message || "Server error");

      setTimeout(() => {
        window.location.href = "/error";
      }, 5000);

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
          <div className={styles.loader}>Loading available opportunities...</div>
        ) : filteredJobs.length === 0 ? (
          <div className={styles.noResults}>No jobs match your current filters.</div>
        ) : (
          <div className={styles.gridContainer}>
            {filteredJobs.map(job => (
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
