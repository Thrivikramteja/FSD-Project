const {
  User,
  CreatedFundraiser,
  UserContributedFundraiser,
  user_message,
} = require("../models/user.model");
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
    const recentMessages = await user_message.get_newmessages(user_ID);

    // Render the dashboard with data
    res.render("users/user_dashboard", {
      name: name || "Donor",
      participatedEvents: participatedEvents || [],
      contributedFundraisers: contributedFundraisers || [],
      ongoingfund: ongoingfund || [],
      upcomingEvents: upcomingEvents || [],
      user: req.session.user,
      recentMessages: recentMessages,
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

async function get_deadline(ngoId, fundraiser_name) {
  try {
    const fundraiser = await CreatedFundraiser.findOne(
      { ngoId: ngoId, fundraiser_name: fundraiser_name },
      { deadline: 1, _id: 0 }
    );

    if (!fundraiser) {
      throw new Error("Fundraiser not found");
    }

    return fundraiser.deadline; // Return the deadline
  } catch (error) {
    console.error("Error fetching deadline:", error);
    throw error;
  }
}

async function get_carehomeid(ngoId, fundraiser_name) {
  try {
    const fundraiser = await CreatedFundraiser.findOne(
      { ngoId: ngoId, fundraiser_name: fundraiser_name },
      { carehomeId: 1, _id: 0 }
    );

    if (!fundraiser) {
      throw new Error("Fundraiser not found");
    }

    return fundraiser.carehomeId; // Return the deadline
  } catch (error) {
    console.error("Error fetching deadline:", error);
    throw error;
  }
}

async function contributed_fund(req, res) {
  try {
    const ngoId = req.params.ngoId;

    const fundraiser_name = req.params.fundraiser_name;
    const amount_contributed = req.body.your_amount;

    if (!req.session.user || !req.session.user.userId) {
      console.log("User not authenticated or session data missing");
      return res.redirect("/login?error=Please log in to contribute");
    }

    const userId = req.session.user.userId; // Corrected: Use lowercase 'user'
    console.log("Session ID for user: " + userId);

    const deadline = await get_deadline(ngoId, fundraiser_name);

    // Log the deadline (for debugging purposes)
    console.log("Deadline for the fundraiser:", deadline);

    // Check if the fundraiser deadline has passed
    const currentDate = new Date();

    // Create a new contribution document using the userContributedFundraisersSchema
    const newContribution = new UserContributedFundraiser({
      userId: userId,
      ngoId: ngoId,
      fundraiser_name: fundraiser_name,
      amount_contributed: amount_contributed,
      contributed_at: currentDate, // This will be the current date/time of contribution
      deadline: deadline, // The fundraiser's deadline
    });

    // Save the new contribution to the database
    await newContribution.save();

    console.log("save succesful to user id " + userId);

    const fundraiser = await CreatedFundraiser.findOneAndUpdate(
      { ngoId, fundraiser_name },
      { $inc: { amount_raised_so_far: amount_contributed } },
      { new: true }
    );
    console.log("sucessfuly updated in ngo side");
    // res.redirect(`users/user_dashboard/${userId}`)
  } catch (error) {
    console.error("Error in contributed_fund:", error);
    res
      .status(500)
      .json({
        message: "An error occurred while processing the contribution.",
      });
  }
}

async function getEditDonorProfile(req, res) {
  const userID = parseInt(req.params.userID, 10);

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
  contributed_fund,
};
