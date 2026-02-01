const { NGO, Event } = require("../models/NGO.model");

async function getLandingPage(req, res, next) {
  try {
    
    // throw new Error("hi i am karthik"); 
    const ongoing_fund = await NGO.ongoing_fund();
    const upcoming_eve = await Event.upcoming_eve();

    res.status(200).json({ ongoing_fund, upcoming_eve });
  } catch (error) {
    error.message = "Could not load the latest updates. Please refresh the page.";
    next(error);
  }
}

async function getNGO(req, res) {
  const ngoID = req.params.ngoID;

  try {
    const ongoing_fund = await new Promise((resolve, reject) => {
      model.ongoing_fund(ngoID, (err, data) => {
        if (err) {
          console.error("Error fetching ongoing_fund:", err);
          resolve([]);
        } else {
          resolve(data);
        }
      });
    });

    const completed_fund = await new Promise((resolve, reject) => {
      model.completed_fund(ngoID, (err, data) => {
        if (err) {
          console.error("Error fetching completed_fund:", err);
          resolve([]);
        } else {
          resolve(data);
        }
      });
    });

    const upcoming_eve = await new Promise((resolve, reject) => {
      model.upcoming_eve(ngoID, (err, data) => {
        if (err) {
          console.error("Error fetching upcoming_eve:", err);
          resolve([]);
        } else {
          resolve(data);
        }
      });
    });

    const completed_event = await new Promise((resolve, reject) => {
      model.completed_event(ngoID, (err, data) => {
        if (err) {
          console.error("Error fetching completed_event:", err);
          resolve([]);
        } else {
          resolve(data);
        }
      });
    });

    const name = await new Promise((resolve, reject) => {
      model.getname(ngoID, (err, data) => {
        if (err) {
          console.error("Error fetching name:", err);
          resolve("Unknown NGO"); 
        } else {
          resolve(data);
        }
      });
    });

    res.render("NGOs/ngo_dashboard", {
      name,
      ongoing_fund,
      completed_fund,
      completed_event,
      upcoming_eve,
      ngoID,
      user: req.session.user,
      userRole: req.session.userRole,
    });
  } catch (error) {
    console.error("Error in getNGO controller:", error);
    error.message = "An error occurred while loading the dashboard"
    next(error);
  }
}

module.exports = {
  getNGO,
  getLandingPage,
};