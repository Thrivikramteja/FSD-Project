import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/header';
import Footer from '../components/footer';
// 🛑 CRITICAL IMPORT: Import headerConfig
import { headerConfig } from "../config/headerConfig"; 

// Define the available job types for filtering
const JOB_TYPES = ["full-time", "part-time", "caretaker", "others"];

// Helper to format MongoDB dates
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        // Creates a Date object from the MongoDB date string (ISO format)
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    } catch (e) {
        return 'Invalid Date';
    }
};


const JobsPage = () => {
    // --- State ---
    const [allJobs, setAllJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilters, setSelectedFilters] = useState([]);
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    
    // NOTE: In a real app, userRole and userId would come from context/auth state.
    const userRole = 'guest'; 
    const userId = ''; 

    // --- Data Fetching (Using the new API endpoint) ---
    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            // 🛑 CRITICAL FIX: Use the new /api/jobs/all endpoint
            const response = await fetch('/api/jobs/all'); 
            
            if (!response.ok) {
                console.error(`Fetch failed with status: ${response.status}.`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Fix for "body stream already read" and "Invalid JSON" error:
            const rawResponseText = await response.text();
            
            // 2. Try to parse it
            const data = JSON.parse(rawResponseText);
            
            let fetchedJobs = [];
            if (Array.isArray(data)) {
                fetchedJobs = data; 
            } else if (data && Array.isArray(data.jobs)) {
                fetchedJobs = data.jobs; 
            }
            
            setAllJobs(fetchedJobs); 
            
            console.log("Successfully fetched jobs:", fetchedJobs.length);

        } catch (err) {
            // This catches network errors, JSON parsing errors, and non-OK HTTP statuses
            console.error('Error fetching/parsing jobs. Check backend route/JSON structure.');
            console.error('Full Error:', err.message);
            setAllJobs([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);
    

    // --- Filtering Logic ---
    const handleFilterChange = (e) => {
        const { value, checked } = e.target;
        setSelectedFilters(prev => 
            checked ? [...prev, value] : prev.filter(f => f !== value)
        );
    };

    const handleApplyFilters = () => {
        setIsFilterDropdownOpen(false);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };
    
    // --- Memoized Filtered Jobs ---
    const filteredJobs = useMemo(() => {
        let jobsToDisplay = allJobs;
        const lowerSearchTerm = searchTerm.toLowerCase();

        // 1. Apply Search Filter
        if (lowerSearchTerm) {
            jobsToDisplay = jobsToDisplay.filter(job => {
                return job.title.toLowerCase().includes(lowerSearchTerm) ||
                       (job.description && job.description.toLowerCase().includes(lowerSearchTerm)) ||
                       (job.location && job.location.toLowerCase().includes(lowerSearchTerm));
            });
        }

        // 2. Apply Type Filter
        if (selectedFilters.length > 0) {
            jobsToDisplay = jobsToDisplay.filter(job => 
                job.type && selectedFilters.includes(job.type.toLowerCase())
            );
        }

        return jobsToDisplay;
    }, [allJobs, searchTerm, selectedFilters]);


    // --- Job Card Renderer ---
    const renderJobCard = (job) => {
        const applyLink = `/jobs/apply/${job._id}`;
        
        return (
            <div key={job._id} className="card p-6 border rounded-lg shadow-md bg-white hover:shadow-xl transition-shadow duration-300">
                <div className="title text-xl font-bold text-gray-800 mb-2">{job.title}</div>
                <div className="content space-y-2 text-sm text-gray-600">
                    <p>{job.description}</p>
                    <p className="font-medium">
                        <span className="text-gray-900">Location:</span> {job.location || 'Not specified'}
                    </p>
                    <p className="font-medium">
                        <span className="text-gray-900">Pay:</span> {job.pay || 'Can be discussed'}
                    </p>
                    <p className="font-medium">
                        <span className="text-gray-900">Type:</span> <span className="text-blue-600 capitalize">{job.type}</span>
                    </p>
                    
                    {/* Display Start and End Dates */}
                    {(job.startDate || job.endDate) && (
                        <p className="font-medium text-xs text-gray-500 pt-2">
                            {job.startDate && `Start: ${formatDate(job.startDate)}`}
                            {job.startDate && job.endDate && ' | '}
                            {job.endDate && `End: ${formatDate(job.endDate)}`}
                        </p>
                    )}

                    {/* The Apply button uses Link for client-side navigation */}
                    <Link to={applyLink} className="mt-4 inline-block px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors">
                        Apply Now
                    </Link>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* 🛑 FIX: Pass navItems prop to prevent Header crash */}
            <Header navItems={headerConfig.landing} />
            <div className="min-h-screen bg-gray-50 py-10">
                <div className="max-w-6xl mx-auto px-4">
                    
                    <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Available Job Opportunities</h1>

                    {/* Search and Filter Container */}
                    <div className="search-filter-container flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 md:space-x-4 bg-white p-6 rounded-lg shadow-lg mb-8">
                        
                        {/* Filter Section */}
                        <div className="filter-section relative flex-shrink-0">
                            <button 
                                className="filter-btn flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                                onClick={() => setIsFilterDropdownOpen(prev => !prev)}
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0012 17.586V21a1 1 0 01-1 1H7a1 1 0 01-1-1v-3.414a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                                <span>Filters ({selectedFilters.length})</span>
                            </button>
                            
                            {/* Filter Dropdown */}
                            {isFilterDropdownOpen && (
                                <div className="filter-dropdown absolute z-10 top-full mt-2 w-64 bg-white p-4 rounded-lg shadow-xl border border-gray-200">
                                    <h3 className="text-lg font-bold mb-3">Filter by Type</h3>
                                    {JOB_TYPES.map(type => (
                                        <label key={type} className="checkbox-label flex items-center space-x-2 py-1 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                value={type} 
                                                checked={selectedFilters.includes(type)}
                                                onChange={handleFilterChange}
                                                className="filter-checkbox form-checkbox h-4 w-4 text-blue-600 rounded"
                                            />
                                            <span className="capitalize">{type}</span>
                                        </label>
                                    ))}
                                    <button 
                                        className="apply-filter-btn w-full mt-4 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
                                        onClick={handleApplyFilters}
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Search Section */}
                        <div className="search-section flex flex-grow w-full md:w-auto space-x-2">
                            <input 
                                type="text" 
                                id="searchInput" 
                                placeholder="Search for jobs by title, location, or description..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="search-input flex-grow p-2 border border-gray-300 rounded-lg focus:border-blue-500"
                            />
                            <button 
                                className="search-btn px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 transition-colors"
                                onClick={handleApplyFilters} // Apply filters after search change
                            >
                                Search
                            </button>
                        </div>
                    </div>
                    
                    {/* Jobs Grid Container */}
                    <div id="jobsContainer" className="grid-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            <p className="col-span-full text-center text-xl text-gray-500">Loading jobs...</p>
                        ) : filteredJobs.length === 0 ? (
                            <p className="col-span-full text-center text-xl text-gray-500">No matching jobs found.</p>
                        ) : (
                            filteredJobs.map(renderJobCard)
                        )}
                    </div>
                </div>
            </div>
            
            <Footer />
        </>
    );
};

export default JobsPage;