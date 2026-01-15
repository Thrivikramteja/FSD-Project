
const { CareHomeJob } = require('../models/carehome.model'); 

const Application = require('../models/Application'); 

const applyToJob = async (req, res) => {
    try {
        const { jobId, experience, location, whyMe } = req.body;
        
        // 1. Session check
        if (!req.session || !req.session.user) {
            return res.status(401).json({ success: false, message: "Please log in to apply." });
        }

        const userId = req.session.user._id;
        console.log(req.session.user.name);
        // 2. Strict Role Check
        if (req.session.userRole !== 'Donor') {
            return res.status(403).json({ success: false, message: "Only Donors or normal user can apply for jobs." });
        }

        // 3. Verify Job exists in the CareHomeJob model
        const job = await CareHomeJob.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: "Job listing not found." });
        }

        // 4. Duplicate Check
        const alreadyApplied = await Application.findOne({ jobId, userId });
        if (alreadyApplied) {
            return res.status(400).json({ success: false, message: "Application already submitted for this role." });
        }

        // 5. Save to the NEW Application model
        const newApplication = new Application({
            jobId,
            userId,
            carehomeId: job.postedBy, // Link to the Carehome owner
            experience,
            applicantLocation: location,
            whyMe,
            status: 'Pending'
        });

        await newApplication.save();

        res.status(201).json({ 
            success: true, 
            message: "Application successfully sent!" 
        });

    } catch (err) {
        console.error("Apply Controller Error:", err);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};

module.exports = { applyToJob };