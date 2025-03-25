const NGO = require("../models/NGO.model");

function getLandingPage(req, res) {
  const fundraisers = NGO.getFundraisers((err, fundraisers) => {
    if (err) {
      console.error("Error fetching fundraisers:", err);
      return;
    }
    console.log("Fundraisers:", fundraisers);
  });
  
  const events = NGO.getEvents((err, events) => {
    if (err) {
      console.error("Error fetching events:", err);
      return;
    }
    console.log("Events:", events);
  });

  res.render("landing-page", { fundraisers, events });
}

module.exports = {
  getLandingPage: getLandingPage,
};
