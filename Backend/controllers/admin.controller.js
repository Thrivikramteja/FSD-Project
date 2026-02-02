const { admin } = require("../models/admin.model");

async function Getadmin(req, res, next) {
  try {
    console.log("Fetching admin data for React API...");

    const [
      highest_Donation,
      high_con_name,
      total_revenue,
      total_ngo,
      total_care,
      total_money,
      total_events,
      top_fund,
    ] = await Promise.all([
      admin.highest_Donation(),
      admin.highest_contributor_with_name(),
      admin.total_revenue(),
      admin.total_ngo(),
      admin.total_care(),
      admin.total_money(),
      admin.total_events(),
      admin.top_fund(),
    ]);

    res.status(200).json({
      highest_Donation,
      high_con_name,
      total_revenue,
      total_ngo,
      total_care,
      total_events,
      total_money,
      top_fund,
    });
  } catch (error) {
    console.error("API Error in Getadmin:", error);
    next(error);
  }
}

module.exports = {
  Getadmin,
};
