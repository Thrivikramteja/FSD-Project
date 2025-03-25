const NGO = require("../models/NGO.model");
const User = require("../models/user.model");

// const promisifyModelMethod = (modelMethod, ...args) =>
//   new Promise((resolve, reject) => {
//     modelMethod(...args, (err, data) => {
//       if (err) {
//         console.error(`Error in model method:`, err);
//         reject(err);
//       } else {
//         console.log(`Data fetched by model method:`, data);
//         resolve(data);
//       }
//     });
//   });



async function getLandingPage(req, res) {
  // const ongoingfund = await promisifyModelMethod(NGO.ongoingfund);
  // const upcomingEvents = await promisifyModelMethod(NGO.upcomingEvents);
  // const fundraisers = NGO.getFundraisers((err, fundraisers) => {
  //   if (err) {
  //     console.error("Error fetching fundraisers:", err);
  //     return;
  //   }
  //   console.log("Fundraisers:", fundraisers);
  // });
  const ongoing_fund = await new Promise((resolve, reject) => {
    NGO.ongoing_fund((err, data) => {
      if (err) {
        console.error("Error fetching ongoing_fund:", err);
        resolve([]); // Default to empty array on error
      } else {
        resolve(data);
      }
    });
  });

  // const events = NGO.getEvents((err, events) => {
  //   if (err) {
  //     console.error("Error fetching events:", err);
  //     return;
  //   }
  //   console.log("Events:", events);
  // });
  const upcoming_eve = await new Promise((resolve, reject) => {
    NGO.upcoming_eve((err, data) => {
      if (err) {
        console.error("Error fetching upcoming_eve:", err);
        resolve([]);
      } else {
        resolve(data);
      }
    });
  });

  res.render("landing-page", { ongoing_fund, upcoming_eve });
}

async function getNGO(req, res) {
  const ngoID = req.params.ngoID;

  try {
    console.log("Fetching data for NGO ID:", ngoID);

    // Fetch data one by one using async/await and new Promise directly
    const ongoing_fund = await new Promise((resolve, reject) => {
      model.ongoing_fund(ngoID, (err, data) => {
        if (err) {
          console.error("Error fetching ongoing_fund:", err);
          resolve([]); // Default to empty array on error
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

    console.log("Fetched Data:");
    console.log("Ongoing Fundraisers:", ongoing_fund);
    console.log("Completed Fundraisers:", completed_fund);
    console.log("Upcoming Events:", upcoming_eve);
    console.log("Completed Events:", completed_event);
    console.log("NGO Name:", name);

    // Render the EJS template with the fetched data
    res.render("NGOs/ngo_dashboard", {
      name,
      ongoing_fund,
      completed_fund,
      completed_event,
      upcoming_eve,
      ngoID,
    });
  } catch (error) {
    console.error("Error in getNGO controller:", error);
    res.status(500).send("An error occurred while loading the dashboard");
  }
}

module.exports = {
  getNGO,
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
