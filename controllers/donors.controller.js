const { User } = require("../models/user.model");
// const NGO = require("../models/NGO.model");
// const Carehome = require("../models/carehome.model");

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

async function getdonor(req, res) {
  const user_ID = parseInt(req.params.userId, 10);

  try {
    console.log(`Fetching data for userId: ${user_ID}`); // Debug the userId being passed

    // Fetch data from model
    const name = await User.getname(user_ID);
    const participatedEvents = await User.participatedEvents(user_ID);
    const contributedFundraisers = await User.contributedFundraisers(user_ID);
    const ongoingfund = await User.ongoingfund(user_ID);
    const upcomingEvents = await User.upcomingEvents(user_ID);

    // Render the dashboard with data
    res.render("users/user_dashboard", {
      name: name || "Donor",
      participatedEvents: participatedEvents || [],
      contributedFundraisers: contributedFundraisers || [],
      ongoingfund: ongoingfund || [],
      upcomingEvents: upcomingEvents || [],
    });
  } catch (error) {
    console.error("Error occurred while fetching user dashboard data:", error);
    res
      .status(500)
      .send(
        "An error occurred while loading the dashboard. Please try again later."
      );
  }
}

async function getEditDonorProfile(req, res) {
  const userID = req.params.userID;

  try {
    const user = await new Promise((resolve) => {
      model.get_user_data(userID, (err, data) => {
        if (err) {
          console.log("error fetching data of user ", err);
          resolve([]);
        } else {
          resolve(data);
        }
      });
    });
    console.log("fetched details ", user);
    res.render("users/edit_profile", { user });
  } catch (error) {
    console.error("Error rendering the Create Event form:", error);
    res.status(500).send("Failed to load the Create Event form");
  }
}

function editDonorProfile() {}

module.exports = {
  getdonor,
  getEditDonorProfile,
  editDonorProfile,
};
