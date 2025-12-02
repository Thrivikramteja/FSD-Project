const path = require('path');

const {
  DonationMoney,
  donate_items
} = require("../models/carehome.model"); 

const {
  User,
  UserRegisteredEvent,
  CreatedFundraiser,
  UserContributedFundraiser,
  user_message,
} = require("../models/user.model");

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

    res.render("users/user_dashboard",{
      name: name || "Donor",
      participatedEvents: participatedEvents || [],
      contributedFundraisers: contributedFundraisers || [],
      ongoingfund: ongoingfund || [],
      upcomingEvents: upcomingEvents || [],
      user: req.session.user,
      recentMessages: recentMessages,
      userRole: userRole
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

    const userId = req.session.user.userId;
    console.log("Session ID for user: " + userId);

    const deadline = await get_deadline(ngoId, fundraiser_name);
    console.log("Deadline for the fundraiser:", deadline);

    const currentDate = new Date();


    const fundraiser = await CreatedFundraiser.findOne({
      ngoId,
      fundraiser_name
    });

    if (!fundraiser) {
      return res.status(404).json({ message: "Fundraiser not found" });
    }

    const newContribution = new UserContributedFundraiser({
      userId: userId,
      ngoId: ngoId,
      fundraiser_name: fundraiser_name,
      amount_contributed: amount_contributed,
      contributed_at: currentDate,
      deadline: deadline,
      fundraiserObjectId: fundraiser._id
    });

    await newContribution.save();
    console.log("save successful to user id " + userId);


    await CreatedFundraiser.findOneAndUpdate(
      { ngoId, fundraiser_name },
      { $inc: { amount_raised_so_far: amount_contributed } },
      { new: true }
    );

    console.log("successfully updated in ngo side");

  } catch (error) {
    console.error("Error in contributed_fund:", error);
    res.status(500).json({
      message: "An error occurred while processing the contribution.",
    });
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
    res.status(500).send("Failed to load the Create Event form");
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
      user: updatedUser
    });

  } catch (error) {
    console.error("Error updating donor profile:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update profile due to a server error."
    });
  }
}

async function getUserActivity (req, res) {
  try {
    const userId = Number(req.params.userId);

    const eventsParticipated = await UserRegisteredEvent.find({ userId })
      .populate("eventObjectId"); 

    const eventsUpcoming = eventsParticipated.filter(
      evt => new Date(evt.event_date) > new Date()
    );

    const fundraisersContributed = await UserContributedFundraiser.find({ userId })
      .populate("fundraiserObjectId"); 

    const donationsMoney = await DonationMoney.find({ userId });

    const donationsItems = await donate_items.find({ userId });

    return res.status(200).json({
      success: true,
      data: {
        events_participated: eventsParticipated,
        events_upcoming: eventsUpcoming,
        fundraisers_contributed: fundraisersContributed,
        donations_money: donationsMoney,
        donations_items: donationsItems
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


module.exports = {
  getdonor,
  getEditDonorProfile,
  editDonorProfile,
  contributed_fund,
  getUserActivity
};