// const { DonationMoney, donate_items } = require("../models/carehome.model");
const { Carehome, DonationMoney, donate_items } = require("../models/carehome.model");


const {
  User,
  UserRegisteredEvent,
  CreatedFundraiser,
  UserContributedFundraiser,
  user_message,
} = require("../models/user.model");

const Application = require("../models/Application");

async function getdonor(req, res) {
  const user_ID = parseInt(req.params.userId, 10);
  const userRole = req.params.userRole;
  try {
    const name = await User.getname(user_ID);
    const participatedEvents = await User.participatedEvents(user_ID);
    const contributedFundraisers = await User.contributedFundraisers(user_ID);
    const ongoingfund = await User.ongoingfund(user_ID);
    const upcomingEvents = await User.upcomingEvents(user_ID);
    const recentMessages = await user_message.get_newmessages(user_ID);

    res.render("users/user_dashboard", {
      name: name || "Donor",
      participatedEvents: participatedEvents || [],
      contributedFundraisers: contributedFundraisers || [],
      ongoingfund: ongoingfund || [],
      upcomingEvents: upcomingEvents || [],
      user: req.session.user,
      recentMessages: recentMessages,
      userRole: userRole,
    });
  } catch (error) {
    console.error("Error occurred while fetching user dashboard data:", error);
    error.message =
      "An error occurred while loading the dashboard. Please try again later.";
    next(error);
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
    error.message = "error while fetching deadline";
    next(error);
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

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.id;
    console.log("JWT User ID contributing: " + userId);

    const deadline = await get_deadline(ngoId, fundraiser_name);
    const fundraiser = await CreatedFundraiser.findOne({
      ngoId,
      fundraiser_name,
    });

    if (!fundraiser) {
      return res.status(404).json({ message: "Fundraiser not found" });
    }

    const newContribution = new UserContributedFundraiser({
      userId: userId,
      ngoId: ngoId,
      fundraiser_name: fundraiser_name,
      amount_contributed: amount_contributed,
      contributed_at: new Date(),
      deadline: deadline,
      fundraiserObjectId: fundraiser._id,
    });

    await newContribution.save();

    await CreatedFundraiser.findOneAndUpdate(
      { ngoId, fundraiser_name },
      { $inc: { amount_raised_so_far: amount_contributed } },
      { new: true }
    );

    res
      .status(200)
      .json({ success: true, message: "Contribution recorded successfully" });
  } catch (error) {
    console.error("Error in contributed_fund:", error);
    error.message = "An error occurred while processing the contribution.";
    next(error);
  }
}

async function getEditDonorProfile(req, res) {
  const userID = parseInt(req.params.userId, 10);

  try {
    const user = await User.getUserByUserId(userID);

    console.log("fetched details ", user);
    res.render("users/edit_profile", {
      user,
      userRole: req.session.userRole,
    });
  } catch (error) {
    console.error("Error rendering the Create Event form:", error);
    error.message = "Failed to load the Create Event form";
    next(error);
  }
}

async function editDonorProfile(req, res) {
  const { fullname, phone, mail } = req.body;
  const userId = parseInt(req.params.userId, 10);

  try {
    const updatedUser = await User.findOneAndUpdate(
      { userId: userId },
      { name: fullname, mobile_number: phone, email: mail },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Donor profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating donor profile:", error);
    error.message = "Failed to update profile due to a server error.";
    next(error);
  }
}

// async function getUserActivity(req, res) {
//   try {
//     const userId = Number(req.params.userId);

//     const eventsParticipated = await UserRegisteredEvent.find({
//       userId,
//     }).populate("eventObjectId");

//     const eventsUpcoming = eventsParticipated.filter(
//       (evt) => new Date(evt.event_date) > new Date()
//     );
//     const already = eventsParticipated.filter(
//       (evt) => new Date(evt.event_date) < new Date()
//     );

//     const fundraisersContributed = await UserContributedFundraiser.find({
//       userId,
//     }).populate("fundraiserObjectId");

//     const donationsMoney = await DonationMoney.find({ userId });

//     const donationsItems = await donate_items.find({ userId });

//     return res.status(200).json({
//       success: true,
//       data: {
//         events_participated: already,
//         events_upcoming: eventsUpcoming,
//         fundraisers_contributed: fundraisersContributed,
//         donations_money: donationsMoney,
//         donations_items: donationsItems,
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     error.message = "Server error";
//     next(error);
//   }
// }

async function getUserActivity(req, res, next) {
  try {
    const userIdParam = req.params.userId;
    // Fix: Handles both the long string ObjectId from the URL and numeric IDs
    const userId = isNaN(userIdParam) ? userIdParam : Number(userIdParam);

    // Parallel fetch using .lean() so we can modify the objects
    const [eventsParticipated, fundraisersContributed, donationsMoney, donationsItems] = await Promise.all([
      UserRegisteredEvent.find({ userId }).populate("eventObjectId"),
      UserContributedFundraiser.find({ userId }).populate("fundraiserObjectId"),
      DonationMoney.find({ userId }).lean(),
      donate_items.find({ userId }).lean()
    ]);

    // Manual join helper to attach Care Home metadata
    const attachCareHomeDetails = async (donations) => {
      return Promise.all(
        donations.map(async (don) => {
          const carehome = await Carehome.findOne({ carehomeId: don.carehomeId })
            .select("care_home_name imagePath city")
            .lean();
          return { 
            ...don, 
            carehomeDetails: carehome || { care_home_name: "Care Home Details Unavailable" } 
          };
        })
      );
    };

    const enrichedMoney = await attachCareHomeDetails(donationsMoney);
    const enrichedItems = await attachCareHomeDetails(donationsItems);

    return res.status(200).json({
      success: true,
      data: {
        events_participated: eventsParticipated.filter(evt => new Date(evt.event_date) < new Date()),
        events_upcoming: eventsParticipated.filter(evt => new Date(evt.event_date) > new Date()),
        fundraisers_contributed: fundraisersContributed,
        donations_money: enrichedMoney, // Now contains Name & Image
        donations_items: enrichedItems,
      },
    });
  } catch (error) {
    next(error); // Sends error to your global handler in app.js
  }
}

async function getTickerData(req, res) {
  try {
    const recentMoney = await DonationMoney.find()
      .sort({ donated_at: -1 })
      .limit(4)
      .lean();

    const recentFundraiser = await UserContributedFundraiser.find()
      .sort({ contributed_at: -1 })
      .limit(4)
      .lean();

    const combineData = async (list, type) => {
      return Promise.all(
        list.map(async (item) => {
          const user = await User.findOne({ userId: item.userId }).lean();
          return {
            name: user ? user.name : "Anonymous",
            amount:
              type === "money" ? item.amount_donated : item.amount_contributed,
            date: type === "money" ? item.donated_at : item.contributed_at,
          };
        })
      );
    };

    const moneyFormatted = await combineData(recentMoney, "money");
    const fundraiserFormatted = await combineData(
      recentFundraiser,
      "fundraiser"
    );

    const tickerData = [...moneyFormatted, ...fundraiserFormatted].sort(
      (a, b) => b.date - a.date
    );

    res.status(200).json({ success: true, data: tickerData });
  } catch (error) {
    console.error("Ticker Data Error:", error);
    error.message = "Failed to fetch ticker data";
    next(error);
  }
}

async function getUserApplications(req, res) {
  try {
    const userId = req.user.id;

    const applications = await Application.find({ userId: userId })
      .populate({
        path: "jobId",
        model: "CareHomeJob",
        select: "title type pay",
      })
      .populate({
        path: "carehomeId",
        model: "Carehome",
        select: "name location",
      })
      .sort({ appliedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      applications: applications,
    });
  } catch (error) {
    console.error("Error fetching user applications:", error);
    error.message = "Server error";
    next(error);
  }
}

module.exports = {
  getdonor,
  getEditDonorProfile,
  editDonorProfile,
  contributed_fund,
  getUserActivity,
  getTickerData,
  getUserApplications,
};
