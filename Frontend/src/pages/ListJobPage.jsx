import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../components/authContext';

import Footer from '../components/footer';
import PremiumTitle from '../components/PremiumTitle'; 
import styles from '../styles/ListJob.module.css'; 
import ApplyModal from '../pages/ApplyModal'; 

const ListJobPage = () => {
  const navigate = useNavigate();
  
  // FIX: Access 'auth' first, then derive user and role
  const { auth } = useContext(AuthContext); 
  const user = auth?.user;
  const userRole = auth?.role;

  console.log(user + " " + userRole);

  const [allJobs, setAllJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);

  const [selectedJob, setSelectedJob] = useState(null); 
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
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
    // FIX: Use userRole derived from auth context
    if (!auth.isLoggedIn || userRole !== "Donor") {
      alert("Only registered Donors can apply for jobs. Please log in as a Donor.");
      return;
    }

    setSelectedJob({ id: job._id, title: job.title  , pay: job.pay});
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

      if (response.ok) {
        alert("Success! Your application has been sent to the Carehome.");
        setSelectedJob(null); 
      } else {
        alert("Notice: " + result.message);
      }
    } catch (error) {
      console.error("Apply error:", error);
      alert("Failed to connect to server.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <PremiumTitle />

      {selectedJob && (
        <ApplyModal 
              jobTitle={selectedJob.title}
              jobPay={selectedJob.pay} // Pass the pay here
              onClose={() => setSelectedJob(null)}
              onSubmit={handleFinalSubmit}
              isLoading={isApplying}
          />
      )}

      <div className={styles.searchFilterContainer}>
        <div className={styles.filterSection}>
          <button 
            className={styles.filterBtn} 
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            Filters
          </button>
          
          {showFilterDropdown && (
            <div className={`${styles.filterDropdown} ${styles.show}`}>
              <h3>Job Type</h3>
              {['full-time', 'part-time', 'caretaker', 'others'].map(type => (
                <label className={styles.checkboxLabel} key={type}>
                  <input 
                    type="checkbox" 
                    value={type} 
                    onChange={handleCheckboxChange}
                    checked={selectedTypes.includes(type)}
                  />
                  <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                </label>
              ))}
              <button className={styles.applyFilterBtn} onClick={applyFilters}>
                Apply Filters
              </button>
            </div>
          )}
        </div>

        <div className={styles.searchSection}>
          <input 
            type="text" 
            placeholder="Search by role, city, or keywords..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className={styles.searchBtn} onClick={handleSearch}>
            Search
          </button>
        </div>
      </div>

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
                
                <div className={styles.locationRow}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  {job.location || 'Remote'}
                </div>

                <p className={styles.jobDescription}>
                  {job.description?.length > 110 ? job.description.substring(0, 110) + "..." : job.description}
                </p>

                <div className={styles.cardFooter}>
                  <button className={styles.applyBtn} onClick={() => handleApplyClick(job)}>
                    Apply Now
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
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