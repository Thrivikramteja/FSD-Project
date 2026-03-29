
const CorporateDonation = require("../models/corporateDonation.model");
const {NGO} = require("../models/NGO.model"); 

const bulkDonate = async (req, res) => {
  try {
    const { companyName, ngoId, amount, purpose } = req.body;

    if (!companyName || !ngoId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    const ngoExists = await NGO.findOne({ ngoId: Number(ngoId) });

    if (!ngoExists) {
      return res.status(404).json({
        success: false,
        message: "NGO not found"
      });
    }

    const donation = await CorporateDonation.create({
      companyName,
      ngoId,
      amount,
      purpose
    });

    res.status(201).json({
      success: true,
      message: "Corporate donation recorded",
      donation
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

module.exports = { bulkDonate };