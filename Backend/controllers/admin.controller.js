const { admin } = require("../models/admin.model");

async function Getadmin(req, res) {
  try {
    console.log("inside admin controller");

    const highest_Donation = await admin.highest_Donation();

    const high_con_name = await admin.highest_contributor_with_name();

    const total_revenue = await admin.total_revenue();

    const total_ngo = await admin.total_ngo();

    const total_care = await admin.total_care();

    const total_money = await admin.total_money();

    const total_events = await admin.total_events();

    const top_fund = await admin.top_fund();

    res.render("admin", {
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
    console.log("got error while  rendering admin : " + error);
  }
}

module.exports = {
  Getadmin,
};
