const { Carehome, DonationMoney, donate_items } = require("../models/carehome.model");
const { NGO } = require('../models/NGO.model');
const {
  User,
  UserRegisteredEvent,
  CreatedFundraiser,
  UserContributedFundraiser,
  user_message,
} = require("../models/user.model");
const { sendNotification } = require('../services/notificationService');

const Application = require("../models/Application");

const redisClient = require('../redis'); 


async function getdonor(req, res, next) {
  const user_ID = parseInt(req.params.userId, 10);
  const cacheKey = `user_profile:${user_ID}`;

  try {
    // 1. REDIS CHECK
    if (redisClient.isReadyStatus) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log("⚡ REDIS HIT: Serving Profile from cache");
        return res.status(200).json(JSON.parse(cached));
      }
    }

    console.log("🐢 DB HIT: Fetching Profile from MongoDB...");

    // 2. PROJECTION: Only fetch the 3 fields shown in your screenshot
    // This is much faster than fetching the whole user object
    const user = await User.findOne({ userId: user_ID })
      .select('name email mobile_number userId') 
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const response = { success: true, user };

    // 3. CACHE THE DATA
    if (redisClient.isReadyStatus) {
      await redisClient.set(cacheKey, JSON.stringify(response), { EX: 600 });
    }

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

async function get_deadline(ngoId, fundraiser_name) {
  try {
    const fundraiser = await CreatedFundraiser.findOne(
      { 
        ngoId: Number(ngoId), 
        fundraiser_name: fundraiser_name,
      },
      { deadline: 1, _id: 1 } 
    );

    if (!fundraiser) {
      throw new Error(`Lookup Failed: No fundraiser named "${fundraiser_name}" for NGO ID ${ngoId}`);
    }

    return fundraiser.deadline; 
  } catch (error) {
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

async function contributed_fund(req, res,next) {
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

    // Notify the NGO that a donation was made
const io = req.app.get('io');
await sendNotification(io, {
    recipientId:   Number(ngoId),
    recipientRole: 'NGO',
    type:          'donation',
    message:       `A donor contributed ₹${amount_contributed} to "${fundraiser_name}"`,
    link: `/NGO-dashboard/${ngoId}`
});

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

async function editDonorProfile(req, res, next) {
  const userId = parseInt(req.params.userId, 10);
  const fullname = req.body.fullname || req.body.name;
  const phone = req.body.phone || req.body.mobile_number;
  const mail = req.body.mail || req.body.email;

  try {
    if (!req.user || Number(req.user.id) !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to edit this donor profile.",
      });
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId: userId },
      { name: fullname, mobile_number: phone, email: mail },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Donor profile not found.",
      });
    }

    // --- PURGE REDIS CACHE ---
    // Clears the donor's dashboard/applications cache to ensure the new name shows up
    await redisClient.del(`user:apps:${userId}`);

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



async function getUserActivity(req, res, next) {
  try {
    const userId = Number(req.params.userId);
    const cacheKey = `user_activity:${userId}`;

    // 1. REDIS CHECK (Skip the DB if we already know the answer)
    if (redisClient.isReadyStatus) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log("⚡ REDIS HIT: Serving activity from cache");
        return res.status(200).json(JSON.parse(cached));
      }
    }

    console.log("🐢 DB HIT: Crawling MongoDB for activity...");

    // 2. OPTIMIZED FETCH: Use .populate() instead of manual loops!
    // This fetches the CareHome names in the SAME query.
    const [events, fundraisers, money, items] = await Promise.all([
      UserRegisteredEvent.find({ userId }).populate("eventObjectId", "event_name event_date").lean(),
      UserContributedFundraiser.find({ userId }).lean(),
      DonationMoney.find({ userId }).populate("carehomeId", "care_home_name imagePath").lean(),
      donate_items.find({ userId }).populate("carehomeId", "care_home_name imagePath").lean()
    ]);

    // 3. PROJECTION & FORMATTING
    const data = {
      events_participated: events.filter(evt => new Date(evt.event_date) < new Date()),
      events_upcoming: events.filter(evt => new Date(evt.event_date) > new Date()),
      contributedFundraisers: fundraisers,
      donations_money: money,
      donations_items: items,
    };

    const response = { success: true, data };

    // 4. SAVE TO REDIS (Cache for 2 minutes)
    if (redisClient.isReadyStatus) {
      await redisClient.set(cacheKey, JSON.stringify(response), { EX: 120 });
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Activity Fetch Error:", error);
    next(error); 
  }
}

async function getTickerData(req, res, next) {
  const cacheKey = 'ticker_data_latest';

  try {
    // 1. REDIS CHECK (This data is the same for everyone, so 1 cache key works!)
    if (redisClient.isReadyStatus) {
      const cached = await redisClient.get(cacheKey);
      if (cached) return res.status(200).json(JSON.parse(cached));
    }

    // 2. PARALLEL FETCH
    const [recentMoney, recentFundraiser] = await Promise.all([
      DonationMoney.find().sort({ donated_at: -1 }).limit(4).lean(),
      UserContributedFundraiser.find().sort({ contributed_at: -1 }).limit(4).lean()
    ]);

    // 3. OPTIMIZED JOIN: Instead of a loop, we get all unique user IDs at once
    const userIds = [...new Set([
      ...recentMoney.map(d => d.userId),
      ...recentFundraiser.map(f => f.userId)
    ])];

    const users = await User.find({ userId: { $in: userIds } })
      .select('userId name')
      .lean();

    // Create a map for O(1) lookup
    const userMap = users.reduce((acc, user) => {
      acc[user.userId] = user.name;
      return acc;
    }, {});

    // 4. FORMAT DATA
    const tickerData = [
      ...recentMoney.map(item => ({
        name: userMap[item.userId] || "Anonymous",
        amount: item.amount_donated,
        date: item.donated_at
      })),
      ...recentFundraiser.map(item => ({
        name: userMap[item.userId] || "Anonymous",
        amount: item.amount_contributed,
        date: item.contributed_at
      }))
    ].sort((a, b) => b.date - a.date);

    const response = { success: true, data: tickerData };

    // 5. CACHE (1 minute is enough for a "live" feed)
    if (redisClient.isReadyStatus) {
      await redisClient.set(cacheKey, JSON.stringify(response), { EX: 60 });
    }

    res.status(200).json(response);
  } catch (error) {
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

async function getUserApplications(req, res, next) {
  try {
    const userId = req.user.id; // From JWT
    
    // 1. PAGINATION (Limit to latest 5 for the dashboard)
    const page = parseInt(req.query.page) || 1;
    const limit = 5; 
    const skip = (page - 1) * limit;

    const cacheKey = `user_apps:${userId}:p${page}`;

    // 2. REDIS CHECK
    if (redisClient.isReadyStatus) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log("⚡ REDIS HIT: Serving Job Applications from cache");
        return res.status(200).json(JSON.parse(cached));
      }
    }

    console.log("🐢 DB HIT: Searching MongoDB for Job Applications...");

    // 3. PROJECTION: Only fetch what we show on the card
    const applications = await Application.find({ userId })
      .populate({
        path: "jobId",
        model: "CareHomeJob",
        select: "title type pay" // <--- PROJECTION
      })
      .populate({
        path: "carehomeId",
        model: "Carehome",
        select: "care_home_name city state" // <--- PROJECTION
      })
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const response = { success: true, applications };

    // 4. SAVE TO REDIS
    if (redisClient.isReadyStatus) {
      await redisClient.set(cacheKey, JSON.stringify(response), { EX: 300 });
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching user applications:", error);
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
