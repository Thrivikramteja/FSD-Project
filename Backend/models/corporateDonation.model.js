const mongoose = require("mongoose");

const corporateDonationSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true
  },
  ngoId: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  purpose: {
    type: String
  },
  donatedAt: {
    type: Date,
    default: Date.now
  },
  email: {
    type: String,
  },
});

module.exports = mongoose.model("CorporateDonation", corporateDonationSchema);