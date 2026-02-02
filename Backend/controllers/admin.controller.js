// const { admin } = require("../models/admin.model");

// async function Getadmin(req, res, next) {
//   try {
//     console.log("inside admin controller");

//     const highest_Donation = await admin.highest_Donation();

//     const high_con_name = await admin.highest_contributor_with_name();

//     const total_revenue = await admin.total_revenue();

//     const total_ngo = await admin.total_ngo();

//     const total_care = await admin.total_care();

//     const total_money = await admin.total_money();

//     const total_events = await admin.total_events();

//     const top_fund = await admin.top_fund();

//     res.render("admin", {
//       highest_Donation,
//       high_con_name,
//       total_revenue,
//       total_ngo,
//       total_care,
//       total_events,
//       total_money,
//       top_fund,
//     });
//   } catch (error) {
//     console.log("got error while  rendering admin : " + error);
//     error.message = "got error while  rendering admin";
//     next(error);
//   }
// }

// module.exports = {
//   Getadmin,
// };
const { admin } = require("../models/admin.model");

async function Getadmin(req, res, next) { // Added 'next' to the parameters
  try {
    console.log("Fetching admin data for React API...");

    // Keep your existing model calls
    const [
      highest_Donation,
      high_con_name,
      total_revenue,
      total_ngo,
      total_care,
      total_money,
      total_events,
      top_fund
    ] = await Promise.all([
      admin.highest_Donation(),
      admin.highest_contributor_with_name(),
      admin.total_revenue(),
      admin.total_ngo(),
      admin.total_care(),
      admin.total_money(),
      admin.total_events(),
      admin.top_fund()
    ]);

    // CHANGE: Instead of res.render, send JSON
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
    // Ensure 'next' is used so your error middleware catches it
    next(error); 
  }
}

module.exports = {
  Getadmin,
};