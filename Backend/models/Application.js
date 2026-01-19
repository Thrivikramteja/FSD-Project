const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  // Reference to the Job (still hosted in your Carehome file/model)
  jobId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Job', // Ensure your Job model is registered as 'Job'
    required: true 
  },
  
  // Reference to the Donor
// models/Application.js
  userId: { type: Number, required: true },

  // Reference to the Carehome
  carehomeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Carehome',
    required: true
  },

  // --- Data from your ApplyModal ---
  experience: { 
    type: Number, 
    required: true 
  },
  applicantLocation: { 
    type: String, 
    required: true 
  },
  whyMe: { 
    type: String, 
    required: true 
  },

  // Status management
  status: { 
    type: String, 
    enum: ['Pending', 'Accepted', 'Rejected', 'Completed'], 
    default: 'Pending' 
  },

  appliedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Application', applicationSchema);