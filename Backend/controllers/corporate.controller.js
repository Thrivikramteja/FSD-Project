const CorporateDonation = require("../models/corporateDonation.model");
const { NGO } = require("../models/NGO.model");
const { sendCorporateDonationEmail } = require("../services/otpService");
const redisClient = require('../redis'); // Path to the file you just created

const bulkDonate = async (req, res) => {
  try {
    const { companyName, ngoId, amount, purpose, email } = req.body;

    if (!companyName || !ngoId || !amount || !email) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const ngoExists = await NGO.findOne({ ngoId: Number(ngoId) });
    if (!ngoExists) {
      return res.status(404).json({ success: false, message: "NGO not found" });
    }

    // 1. Save to Database
    const donation = await CorporateDonation.create({
      companyName,
      ngoId: Number(ngoId),
      amount: Number(amount),
      purpose,
      email // Ensure your schema has this field
    });

    // 2. Send Confirmation Email
    try {
      await sendCorporateDonationEmail(email, companyName, ngoExists.Ngoname, amount);
    } catch (mailError) {
      console.error("Mail failed to send, but donation recorded:", mailError);
    }

// --- REDIS CACHE PURGE ---
    // This deletes the stale dashboard snapshot for the NGO
    const cacheKey = `dash:ngo:${ngoId}`;
    await redisClient.del(cacheKey); 
    
    // Also purge the global NGO list if it contains aggregate totals
    await redisClient.del('ngos:all:p1'); 

    res.status(201).json({
      success: true,
      message: "Donation recorded and cache purged successfully.",
      donation
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { bulkDonate };