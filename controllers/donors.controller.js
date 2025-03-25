const User = require("../models/user.model");
// const NGO = require("../models/NGO.model");
// const Carehome = require("../models/carehome.model");

const promisifyModelMethod = (modelMethod, ...args) =>
  new Promise((resolve, reject) => {
    modelMethod(...args, (err, data) => {
      if (err) {
        console.error(`Error in model method:`, err);
        reject(err);
      } else {
        console.log(`Data fetched by model method:`, data);
        resolve(data);
      }
    });
  });

async function getdonor(req, res) {
  const user_ID = req.params.userId;

  try {
    console.log(`Fetching data for userId: ${user_ID}`); // Debug the userId being passed

    // Fetch data from model
    const name = await promisifyModelMethod(User.getname, user_ID);
    const participatedEvents = await promisifyModelMethod(
      User.participatedEvents,
      user_ID
    );
    const contributedFundraisers = await promisifyModelMethod(
      User.contributedFundraisers,
      user_ID
    );
    const ongoingfund = await promisifyModelMethod(User.ongoingfund, user_ID);
    const upcomingEvents = await promisifyModelMethod(
      User.upcomingEvents,
      user_ID
    );

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

module.exports = {
  getdonor,
};
