
const { CareHomeJob } = require('../models/carehome.model'); 

const Application = require('../models/Application'); 

const applyToJob = async (req, res) => {
    try {
        const { jobId, experience, location, whyMe } = req.body;
        
        // 1. JWT User Check
        // The authenticate middleware ensures req.user exists
        if (!req.user || !req.user.id) {
            return res.status(401).json({ 
                success: false, 
                message: "Authentication failed. Please log in again." 
            });
        }

        const userId = req.user.id;
        
        // 2. Strict Role Check (using JWT payload)
        if (req.user.role !== 'Donor') {
            return res.status(403).json({ 
                success: false, 
                message: "Only Donors or normal users can apply for roles." 
            });
        }

        // 3. Verify Job exists
        const job = await CareHomeJob.findById(jobId);
        if (!job) {
            return res.status(404).json({ 
                success: false, 
                message: "Job listing not found." 
            });
        }

        // 4. Duplicate Check
        const alreadyApplied = await Application.findOne({ jobId, userId });
        if (alreadyApplied) {
            return res.status(400).json({ 
                success: false, 
                message: "Application already submitted for this role." 
            });
        }

        // 5. Save using the JWT-provided userId
        const newApplication = new Application({
            jobId,
            userId,
            carehomeId: job.postedBy, 
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
        err.message = "An internal server error occurred.";
        next(err);
    }
};


module.exports = { applyToJob };