const { NGO, Event } = require("../models/NGO.model");

async function getLandingPage(req, res) {
  const ongoing_fund = await NGO.ongoing_fund();
  const upcoming_eve = await Event.upcoming_eve();

  res.render("landing-page", {
    ongoing_fund,
    upcoming_eve,
    user: req.session.user,
    userRole: req.session.userRole,
  });
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
          resolve("Unknown NGO"); // Default name on error
        } else {
          resolve(data);
        }
      });
    });

    // Render the EJS template with the fetched data
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
    res.status(500).send("An error occurred while loading the dashboard");
  }
}

module.exports = {
  getNGO,
  getLandingPage,
};

// async function getdonor(req, res) {
//   const user_ID = req.params.userId;

//   try {
//     console.log(`Fetching data for userId: ${user_ID}`); // Debug the userId being passed

//     // Fetch data from model
//     const name = await promisifyModelMethod(User.getname, user_ID);
//     const participatedEvents = await promisifyModelMethod(
//       User.participatedEvents,
//       user_ID
//     );
//     const contributedFundraisers = await promisifyModelMethod(
//       User.contributedFundraisers,
//       user_ID
//     );
//     const ongoingfund = await promisifyModelMethod(User.ongoingfund, user_ID);
//     const upcomingEvents = await promisifyModelMethod(
//       User.upcomingEvents,
//       user_ID
//     );

//     // Render the dashboard with data
//     res.render("users/user_dashboard", {
//       name: name || "Donor",
//       participatedEvents: participatedEvents || [],
//       contributedFundraisers: contributedFundraisers || [],
//       ongoingfund: ongoingfund || [],
//       upcomingEvents: upcomingEvents || [],
//     });
//   } catch (error) {
//     console.error("Error occurred while fetching user dashboard data:", error);
//     res
//       .status(500)
//       .send(
//         "An error occurred while loading the dashboard. Please try again later."
//       );
//   }
// }

module.exports = {
  getLandingPage: getLandingPage,
};
