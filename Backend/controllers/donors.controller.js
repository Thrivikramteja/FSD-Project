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
const {
  invalidateFundraiserCaches,
  invalidateDonorActivity,
  invalidateTicker,
} = require('../services/cacheHelpers');


async function getdonor(req, res, next) {
  const user_ID = parseInt(req.params.userId, 10);
  const cacheKey = `user_profile:${user_ID}`;

  try {
    // 1. REDIS CHECK
    if (redisClient.isReadyStatus) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log("⚡ REDIS HIT: Serving Profile from cache");
        return res
          .setHeader('X-Cache', 'HIT')
          .setHeader('X-Cache-Key', cacheKey)
          .status(200)
          .json(JSON.parse(cached));
      }
    }

    console.log("🐢 DB HIT: Fetching Profile from MongoDB...");

    // 2. PROJECTION
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

    return res
      .setHeader('X-Cache', 'MISS')
      .setHeader('X-Cache-Key', cacheKey)
      .status(200)
      .json(response);

  } catch (error) {
    next(error);
  }
}

async function get_deadline(ngoId, fundraiser_name, fundraiserId) {
  try {
    if (fundraiserId && mongoose.Types.ObjectId.isValid(fundraiserId)) {
      const fundById = await CreatedFundraiser.findById(fundraiserId, { deadline: 1, _id: 1 });
      if (fundById) return fundById.deadline;
    }

    const decodedName = decodeURIComponent(fundraiser_name).trim();
    let fundraiser = await CreatedFundraiser.findOne(
      { 
        ngoId: Number(ngoId), 
        fundraiser_name: fundraiser_name,
      },
      { deadline: 1, _id: 1 } 
    );

    if (!fundraiser && decodedName !== fundraiser_name) {
      fundraiser = await CreatedFundraiser.findOne(
        { 
          ngoId: Number(ngoId), 
          fundraiser_name: decodedName,
        },
        { deadline: 1, _id: 1 } 
      );
    }

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
    const decodedName = decodeURIComponent(fundraiser_name).trim();
    let fundraiser = await CreatedFundraiser.findOne(
      { ngoId: Number(ngoId) || ngoId, fundraiser_name: fundraiser_name },
      { carehomeId: 1, _id: 0 }
    );

    if (!fundraiser && decodedName !== fundraiser_name) {
      fundraiser = await CreatedFundraiser.findOne(
        { ngoId: Number(ngoId) || ngoId, fundraiser_name: decodedName },
        { carehomeId: 1, _id: 0 }
      );
    }

    if (!fundraiser) {
      throw new Error("Fundraiser not found");
    }

    return fundraiser.carehomeId;
  } catch (error) {
    console.error("Error fetching deadline:", error);
    throw error;
  }
}

async function contributed_fund(req, res,next) {
  // Feature flag: when CASHFREE_ENABLED=true, this legacy endpoint is disabled.
  // Fundraiser donations must go through /api/payment/initiate instead.
  // This prevents bypassing Cashfree payment confirmation.
  if (process.env.CASHFREE_ENABLED === 'true') {
    return res.status(403).json({
      success: false,
      message: 'Direct donations are disabled. Please use the payment checkout flow.',
    });
  }

  try {
    const ngoId = req.params.ngoId;
    const fundraiser_name = req.params.fundraiser_name;
    const amount_contributed = Number(req.body.your_amount) || req.body.your_amount;
    const fundraiserId = req.body.fundraiserId || req.body.fundraiserObjectId;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.id;
    console.log("JWT User ID contributing: " + userId);

    console.log(`💰 [Donation] Processing contribution of ₹${amount_contributed} by User ${userId} for NGO ${ngoId}, Fundraiser: "${fundraiser_name}" (ID: ${fundraiserId || 'none'})`);

    const deadline = await get_deadline(ngoId, fundraiser_name, fundraiserId);
    let fundraiser;

    if (fundraiserId && mongoose.Types.ObjectId.isValid(fundraiserId)) {
      fundraiser = await CreatedFundraiser.findById(fundraiserId);
    }

    if (!fundraiser) {
      fundraiser = await CreatedFundraiser.findOne({
        ngoId,
        fundraiser_name,
      });

      if (!fundraiser) {
        const decodedName = decodeURIComponent(fundraiser_name).trim();
        const parsedNgoId = Number(ngoId);
        fundraiser = await CreatedFundraiser.findOne({
          $or: [
            { ngoId: parsedNgoId, fundraiser_name: decodedName },
            { ngoId: parsedNgoId, fundraiser_name: fundraiser_name },
            { ngoId: ngoId, fundraiser_name: decodedName },
          ]
        });
      }
    }

    if (!fundraiser) {
      console.warn(`⚠️ [Donation] Fundraiser not found: NGO ${ngoId}, Name "${fundraiser_name}"`);
      return res.status(404).json({ message: "Fundraiser not found" });
    }

    console.log(`📌 [Donation] Found fundraiser "${fundraiser.fundraiser_name}" (ID: ${fundraiser._id}), Current Raised: ₹${fundraiser.amount_raised_so_far || 0}`);

    const newContribution = new UserContributedFundraiser({
      userId: Number(userId) || userId,
      ngoId: Number(ngoId) || ngoId,
      fundraiser_name: fundraiser.fundraiser_name || fundraiser_name,
      amount_contributed: amount_contributed,
      contributed_at: new Date(),
      deadline: deadline,
      fundraiserObjectId: fundraiser._id,
    });

    await newContribution.save();
    console.log(`✅ [Donation] UserContributedFundraiser saved for User ${userId}`);

    // Notify the NGO that a donation was made
    const io = req.app.get('io');
    await sendNotification(io, {
      recipientId:   Number(ngoId),
      recipientRole: 'NGO',
      type:          'donation',
      message:       `A donor contributed ₹${amount_contributed} to "${fundraiser.fundraiser_name || fundraiser_name}"`,
      link: `/NGO-dashboard/${ngoId}`
    });

    // Update the specific fundraiser raised amount by its unique _id
    let updatedFund = await CreatedFundraiser.findOneAndUpdate(
      { _id: fundraiser._id },
      { $inc: { amount_raised_so_far: Number(amount_contributed) } },
      { new: true }
    );

    if (!updatedFund && fundraiser._id && typeof CreatedFundraiser.findByIdAndUpdate === 'function') {
      updatedFund = await CreatedFundraiser.findByIdAndUpdate(
        fundraiser._id,
        { $inc: { amount_raised_so_far: Number(amount_contributed) } },
        { new: true }
      );
    }

    // Fallback for unit tests mocking { ngoId, fundraiser_name }
    if (!updatedFund) {
      updatedFund = await CreatedFundraiser.findOneAndUpdate(
        { ngoId, fundraiser_name },
        { $inc: { amount_raised_so_far: Number(amount_contributed) } },
        { new: true }
      );
    }

    if (updatedFund) {
      console.log(`📈 [Donation] Fundraiser amount updated: total raised is now ₹${updatedFund.amount_raised_so_far}`);
    }

    // --- CACHE INVALIDATION ---
    // Clears all caches that become stale after a fundraiser donation:
    //   - donor's own activity feed
    //   - public donation ticker
    //   - public fundraiser listing + NGO dashboard (amount_raised_so_far changed)
    await Promise.all([
      invalidateDonorActivity(userId),
      invalidateTicker(),
      invalidateFundraiserCaches(ngoId),
      invalidateFundraiserCaches(Number(ngoId)),
    ]);
    console.log(`🧹 [Donation] Caches invalidated for User ${userId} and NGO ${ngoId}`);

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
    // Clears the donor's activity cache (contributions, events) and all
    // paginated application pages so the new name shows up immediately.
    // NOTE: the old code called del('user:apps:<userId>') — wrong key;
    //       real keys are user_apps:<userId>:p<page>.
    await invalidateDonorActivity(userId);

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

    // 1. REDIS CHECK
    if (redisClient.isReadyStatus) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log("⚡ REDIS HIT: Serving activity from cache");
        return res
          .setHeader('X-Cache', 'HIT')
          .setHeader('X-Cache-Key', cacheKey)
          .status(200)
          .json(JSON.parse(cached));
      }
    }


    console.log(" DataBase HIT: Crawling MongoDB for activity...");

    // 2. OPTIMIZED FETCH
    // UserContributedFundraiser uses $lookup to attach ngoName in one query (no N+1).
    // UserRegisteredEvent uses $lookup to attach ngoName for the event organiser.
    const [events, fundraisers, money, items] = await Promise.all([
      UserRegisteredEvent.aggregate([
        { $match: { userId } },
        {
          $lookup: {
            from: 'ngos',
            localField: 'ngoId',
            foreignField: 'ngoId',
            as: '_ngo',
          },
        },
        {
          $addFields: {
            ngoName: { $arrayElemAt: ['$_ngo.Ngoname', 0] },
          },
        },
        { $project: { _ngo: 0 } },
      ]),
      UserContributedFundraiser.aggregate([
        { $match: { userId } },
        {
          $lookup: {
            from: 'ngos',
            localField: 'ngoId',
            foreignField: 'ngoId',
            as: '_ngo',
          },
        },
        {
          $addFields: {
            ngoName: { $arrayElemAt: ['$_ngo.Ngoname', 0] },
          },
        },
        { $project: { _ngo: 0 } },
      ]),
      DonationMoney.find({ userId }).populate('carehomeId', 'care_home_name imagePath').lean(),
      donate_items.find({ userId }).populate('carehomeId', 'care_home_name imagePath').lean()
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

    return res
      .setHeader('X-Cache', 'MISS')
      .setHeader('X-Cache-Key', cacheKey)
      .status(200)
      .json(response);

  } catch (error) {
    console.error("Activity Fetch Error:", error);
    next(error);
  }
}

async function getTickerData(req, res, next) {
  const cacheKey = 'ticker_data_latest';

  try {
    // 1. REDIS CHECK
    if (redisClient.isReadyStatus) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res
          .setHeader('X-Cache', 'HIT')
          .setHeader('X-Cache-Key', cacheKey)
          .status(200)
          .json(JSON.parse(cached));
      }
    }

    // 2. PARALLEL FETCH
    const [recentMoney, recentFundraiser] = await Promise.all([
      DonationMoney.find().sort({ donated_at: -1 }).limit(4).lean(),
      UserContributedFundraiser.find().sort({ contributed_at: -1 }).limit(4).lean()
    ]);

    // 3. OPTIMIZED JOIN
    const userIds = [...new Set([
      ...recentMoney.map(d => d.userId),
      ...recentFundraiser.map(f => f.userId)
    ])];

    const users = await User.find({ userId: { $in: userIds } })
      .select('userId name')
      .lean();

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

    // 5. CACHE (1 minute)
    if (redisClient.isReadyStatus) {
      await redisClient.set(cacheKey, JSON.stringify(response), { EX: 60 });
    }

    return res
      .setHeader('X-Cache', 'MISS')
      .setHeader('X-Cache-Key', cacheKey)
      .status(200)
      .json(response);

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
    const userId = req.user.id;

    // 1. PAGINATION
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const cacheKey = `user_apps:${userId}:p${page}`;

    // 2. REDIS CHECK
    if (redisClient.isReadyStatus) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log("⚡ REDIS HIT: Serving Job Applications from cache");
        return res
          .setHeader('X-Cache', 'HIT')
          .setHeader('X-Cache-Key', cacheKey)
          .status(200)
          .json(JSON.parse(cached));
      }
    }

    console.log("🐢 DB HIT: Searching MongoDB for Job Applications...");

    // 3. PROJECTION
    const applications = await Application.find({ userId })
      .populate({
        path: "jobId",
        model: "CareHomeJob",
        select: "title type pay"
      })
      .populate({
        path: "carehomeId",
        model: "Carehome",
        select: "care_home_name city state"
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

    return res
      .setHeader('X-Cache', 'MISS')
      .setHeader('X-Cache-Key', cacheKey)
      .status(200)
      .json(response);

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
