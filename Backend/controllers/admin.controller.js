const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const redisClient = require("../redis"); 

const { NGO, Event } = require("../models/NGO.model");
const { 
  CreatedFundraiser, 
  UserContributedFundraiser, 
  User, 
  UserRegisteredEvent 
} = require("../models/user.model");
const { Carehome, DonationMoney } = require('../models/carehome.model');

// Optimization Constants
const CACHE_TTL_SECONDS = 30;
const DONOR_COLLECTION = User.collection.collectionName;
const NGO_COLLECTION = NGO.collection.collectionName;
const CAREHOME_COLLECTION = Carehome.collection.collectionName;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * REDIS OPTIMIZATION HELPERS
 */
async function getCached(key) {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
}

async function setCached(key, value) {
  try {
    await redisClient.setEx(key, CACHE_TTL_SECONDS, JSON.stringify(value));
  } catch (err) {
    console.error("Redis Set Error:", err);
  }
}

async function clearAdminCache() {
  try {
    const keys = await redisClient.keys('admin:*');
    if (keys.length > 0) await redisClient.del(keys);
  } catch (err) {
    console.error("Redis Clear Error:", err);
  }
}

/**
 * UTILS
 */
function monthLabel(year, month) {
  return new Date(year, month - 1, 1).toLocaleString("default", { month: "short" });
}

function setCacheHeader(res, status) {
  res.set("X-Cache", status);
}

function validateObjectId(value, label) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    const error = new Error(`Invalid ${label}`);
    error.statusCode = 400;
    throw error;
  }
  return new mongoose.Types.ObjectId(value);
}

/**
 * 1. BUSINESS OVERVIEW (OPTIMIZED)
 */
async function Getadmin(req, res, next) {
  const cacheKey = "admin:main-stats";
  try {
    const cached = await getCached(cacheKey);
    if (cached) {
      setCacheHeader(res, "HIT");
      return res.status(200).json(cached);
    }

    setCacheHeader(res, "MISS");

    const [
      highestDonationAgg,
      topContributorAgg,
      fundAgg,
      donAgg,
      totalNgo,
      totalCare,
      totalEvents,
      top_fund,
      monthlyFundAgg,
      monthlyDonAgg
    ] = await Promise.all([
      DonationMoney.aggregate([{ $group: { _id: null, max: { $max: "$amount_donated" } } }]),
      UserContributedFundraiser.aggregate([
        { $group: { _id: "$userId", total: { $sum: "$amount_contributed" } } },
        { $sort: { total: -1 } }, { $limit: 1 },
        { $lookup: { from: DONOR_COLLECTION, localField: "_id", foreignField: "userId", as: "u" } },
        { $project: { name: { $ifNull: [{ $arrayElemAt: ["$u.name", 0] }, "N/A"] }, total: 1 } }
      ]),
      UserContributedFundraiser.aggregate([{ $group: { _id: null, total: { $sum: "$amount_contributed" } } }]),
      DonationMoney.aggregate([{ $group: { _id: null, total: { $sum: "$amount_donated" } } }]),
      NGO.countDocuments(),
      Carehome.countDocuments(),
      Event.countDocuments({ event_date: { $gte: new Date() } }),
      CreatedFundraiser.find({ deadline: { $gte: new Date() } }).sort({ amount_raised_so_far: -1 }).limit(3).lean(),
      UserContributedFundraiser.aggregate([{ $group: { _id: { y: { $year: "$contributed_at" }, m: { $month: "$contributed_at" } }, t: { $sum: "$amount_contributed" } } }]),
      DonationMoney.aggregate([{ $group: { _id: { y: { $year: "$donated_at" }, m: { $month: "$donated_at" } }, t: { $sum: "$amount_donated" } } }])
    ]);

    const total_money = (fundAgg[0]?.total || 0) + (donAgg[0]?.total || 0);
    const monthlyMap = new Map();
    [...monthlyFundAgg, ...monthlyDonAgg].forEach(r => {
      const key = `${r._id.y}-${r._id.m}`;
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + (r.t || 0));
    });

    const monthlyBusiness = [...monthlyMap.entries()]
      .map(([k, v]) => {
        const [y, m] = k.split("-").map(Number);
        return { name: monthLabel(y, m), profit: (v * 0.08).toFixed(2), y, m };
      })
      .sort((a, b) => a.y !== b.y ? a.y - b.y : a.m - b.m).slice(-12);

    const payload = {
      highest_Donation: highestDonationAgg[0]?.max || 0,
      high_con_name: topContributorAgg[0] || { name: "N/A", total: 0 },
      total_revenue: (total_money * 0.08).toFixed(2),
      total_ngo: totalNgo, total_care: totalCare, total_events: totalEvents, total_money, top_fund, monthlyBusiness
    };

    await setCached(cacheKey, payload);
    return res.status(200).json(payload);
  } catch (error) { next(error); }
}

/**
 * 2. EVENTS ANALYTICS (OPTIMIZED)
 */
const getAdminEventAnalytics = async (req, res) => {
  const cacheKey = "admin:events-analytics";
  try {
    const cached = await getCached(cacheKey);
    if (cached) {
      setCacheHeader(res, "HIT");
      return res.status(200).json(cached);
    }

    setCacheHeader(res, "MISS");

    const now = new Date();
    const [groups, influentialNgoAgg, topEvent] = await Promise.all([
      Event.aggregate([{
        $facet: {
          ongoing: [{ $match: { event_date: { $eq: now } } }],
          upcoming: [{ $match: { event_date: { $gt: now } } }],
          completed: [{ $match: { event_date: { $lt: now } } }]
        }
      }]),
      Event.aggregate([
        { $group: { _id: "$ngoId", impact: { $sum: "$number_of_registrations" } } },
        { $sort: { impact: -1 } }, { $limit: 1 },
        { $lookup: { from: NGO_COLLECTION, localField: "_id", foreignField: "ngoId", as: "n" } },
        { $project: { name: { $arrayElemAt: ["$n.Ngoname", 0] }, impact: 1 } }
      ]),
      Event.findOne().sort({ number_of_registrations: -1 }).lean()
    ]);

    const responseData = {
      success: true,
      analytics: { influentialNgo: influentialNgoAgg[0] || { name: "N/A", impact: 0 }, influentialEvent: topEvent || { event_name: "N/A", number_of_registrations: 0 } },
      groups: groups[0]
    };

    await setCached(cacheKey, responseData);
    res.status(200).json(responseData);
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

/**
 * 3. FUNDRAISERS ANALYTICS (OPTIMIZED)
 */
const getAdminFundraiserAnalytics = async (req, res) => {
  const cacheKey = "admin:fundraisers-analytics";
  try {
    const cached = await getCached(cacheKey);
    if (cached) {
      setCacheHeader(res, "HIT");
      return res.status(200).json(cached);
    }

    setCacheHeader(res, "MISS");

    const now = new Date();
    const [fundraisers, ngoRevenue] = await Promise.all([
      CreatedFundraiser.aggregate([
        { $lookup: { from: NGO_COLLECTION, localField: "ngoId", foreignField: "ngoId", as: "n" } },
        { $lookup: { from: CAREHOME_COLLECTION, localField: "carehomeId", foreignField: "carehomeId", as: "c" } },
        { $project: { fundraiser_name: 1, amount_raised_so_far: 1, goal_amount: 1, deadline: 1, ngoName: { $arrayElemAt: ["$n.Ngoname", 0] }, carehomeName: { $arrayElemAt: ["$c.care_home_name", 0] } } }
      ]),
      UserContributedFundraiser.aggregate([
        { $group: { _id: "$ngoId", total: { $sum: "$amount_contributed" } } },
        { $lookup: { from: NGO_COLLECTION, localField: "_id", foreignField: "ngoId", as: "n" } },
        { $project: { name: { $arrayElemAt: ["$n.Ngoname", 0] }, total: 1 } },
        { $sort: { total: -1 } }
      ])
    ]);

    const responseData = {
      success: true,
      analytics: { top3Ongoing: fundraisers.filter(f => new Date(f.deadline) >= now).sort((a,b) => b.amount_raised_so_far - a.amount_raised_so_far).slice(0,3), ngoRevenue },
      groups: { ongoing: fundraisers.filter(f => new Date(f.deadline) >= now), completed: fundraisers.filter(f => new Date(f.deadline) < now) }
    };

    await setCached(cacheKey, responseData);
    res.status(200).json(responseData);
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

/**
 * 4. DIRECT DONATIONS ANALYTICS (OPTIMIZED)
 */
const getAdminDonationAnalytics = async (req, res) => {
  const cacheKey = "admin:donations-analytics";
  try {
    const cached = await getCached(cacheKey);
    if (cached) {
      setCacheHeader(res, "HIT");
      return res.status(200).json(cached);
    }

    setCacheHeader(res, "MISS");

    const [carehomeImpact, donations] = await Promise.all([
      DonationMoney.aggregate([
        { $group: { _id: "$carehomeId", total: { $sum: "$amount_donated" } } },
        { $lookup: { from: CAREHOME_COLLECTION, localField: "_id", foreignField: "carehomeId", as: "c" } },
        { $project: { name: { $arrayElemAt: ["$c.care_home_name", 0] }, total: 1, carehomeId: "$_id" } },
        { $sort: { total: -1 } }
      ]),
      DonationMoney.find().lean()
    ]);

    const monthlyStats = donations.reduce((acc, d) => {
      const m = new Date(d.donated_at).toLocaleString('default', { month: 'short' });
      acc[m] = (acc[m] || 0) + d.amount_donated;
      return acc;
    }, {});

    const responseData = {
      success: true,
      analytics: { carehomeImpact, monthlyStats: Object.entries(monthlyStats).map(([name, total]) => ({ name, total })), platformTotal: donations.reduce((acc, d) => acc + d.amount_donated, 0) }
    };

    await setCached(cacheKey, responseData);
    res.status(200).json(responseData);
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

/**
 * 5. MANAGEMENT (ORIGINAL LOGIC - UNCHANGED)
 */
const getAllDonors = async (req, res) => {
  try {
    const donors = await User.find({}, 'userId name email mobile_number').lean();
    res.status(200).json({ success: true, donors });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getDonorManagementStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const [user, events, contributions, directDonations] = await Promise.all([
      User.findOne({ userId: Number(userId) }).lean(),
      UserRegisteredEvent.find({ userId: Number(userId) }).lean(),
      UserContributedFundraiser.find({ userId: Number(userId) }).lean(),
      DonationMoney.find({ userId: Number(userId) }).lean()
    ]);
    if (!user) return res.status(404).json({ success: false, message: "Donor not found" });
    const allAmounts = [...contributions.map(c => c.amount_contributed), ...directDonations.map(d => d.amount_donated)];
    res.status(200).json({
      success: true,
      stats: { ...user, highestDonation: allAmounts.length > 0 ? Math.max(...allAmounts) : 0, totalImpact: allAmounts.reduce((acc, curr) => acc + curr, 0), eventCount: events.length, fundraiserCount: contributions.length, directCount: directDonations.length }
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deleteDonorWithEmail = async (req, res) => {
    const { userId, email, reason, name } = req.query;

    try {
        await User.deleteOne({ userId: Number(userId) });

        await transporter.sendMail({
            from: `"CareConnect Admin" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Account Deactivation Notice",
            html: `<div style="font-family: sans-serif; border: 1px solid #E0EADD; padding: 20px;">
                    <h2 style="color: #1B4332;">Hi ${name},</h2>
                    <p>Your donor account has been removed by the admin.</p>
                    <p><b>Reason:</b> ${reason}</p>
                   </div>`
        });

        res.status(200).json({ success: true });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAllNgoManagement = async (req, res) => {
  try {
    const ngos = await NGO.find({}, 'ngoId Ngoname email darpan_id').lean();
    res.status(200).json({ success: true, ngos });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getNgoManagementStats = async (req, res) => {
  try {
    const { ngoId } = req.params;
    const [ngo, events, fundraisers] = await Promise.all([
      NGO.findOne({ ngoId: Number(ngoId) }).lean(),
      Event.find({ ngoId: Number(ngoId) }).lean(),
      CreatedFundraiser.find({ ngoId: Number(ngoId) }).lean()
    ]);
    if (!ngo) return res.status(404).json({ success: false, message: "NGO not found" });
    const highestFunding = fundraisers.length > 0 ? Math.max(...fundraisers.map(f => f.amount_raised_so_far)) : 0;
    const highestRegistrations = events.length > 0 ? Math.max(...events.map(e => e.number_of_registrations)) : 0;
    res.status(200).json({ success: true, stats: { ...ngo, totalEvents: events.length, totalFundraisers: fundraisers.length, highestFunding, highestRegistrations } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deleteNgoWithEmail = async (req, res) => {
    const { ngoId, email, reason, name } = req.query;

    try {
        await NGO.deleteOne({ ngoId: Number(ngoId) });

        await transporter.sendMail({
            from: `"CareConnect Admin" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Partnership Deactivation Notice - CareConnect",
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #E0EADD;">
                    <h2 style="color: #1B4332;">Hello ${name},</h2>
                    <p>We regret to inform you that your NGO partnership has been terminated.</p>
                    <p><b>Reason for Deactivation:</b></p>
                    <p style="padding: 15px; background: #F8FAF9; border-left: 4px solid #D63031;">${reason}</p>
                </div>`
        });

        res.status(200).json({ success: true });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAllCarehomeManagement = async (req, res) => {
  try {
    const carehomes = await Carehome.find({}, 'carehomeId care_home_name email reg_number').lean();
    res.status(200).json({ success: true, carehomes });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getCarehomeManagementStats = async (req, res) => {
  try {
    const { carehomeId } = req.params;
    const id = Number(carehomeId);
    const [home, directDonations, campaigns] = await Promise.all([
      Carehome.findOne({ carehomeId: id }).lean(),
      DonationMoney.find({ carehomeId: id }).lean(),
      CreatedFundraiser.find({ carehomeId: id }).lean()
    ]);
    if (!home) return res.status(404).json({ success: false, message: "Carehome not found" });
    const fundraiserContributions = await UserContributedFundraiser.find({ fundraiser_name: { $in: campaigns.map(c => c.fundraiser_name) } }).lean();
    res.status(200).json({
      success: true,
      stats: { ...home, totalDirectMoney: directDonations.reduce((acc, d) => acc + d.amount_donated, 0), totalFundraiserMoney: fundraiserContributions.reduce((acc, c) => acc + c.amount_contributed, 0), campaignCount: campaigns.length, totalSupporters: [...new Set([...directDonations.map(d => d.userId), ...fundraiserContributions.map(c => c.userId)])].length }
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deleteCarehomeWithEmail = async (req, res) => {
    const { carehomeId, email, reason, name } = req.query;

    try {
        await Carehome.deleteOne({ carehomeId: Number(carehomeId) });

        await transporter.sendMail({
            from: `"CareConnect Admin" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Platform De-listing Notice: Carehome Profile",
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #E0EADD;">
                    <h2 style="color: #1B4332;">Hello Management, ${name},</h2>
                    <p>Your carehome profile has been removed from our active database.</p>
                    <p><b>Official Reason:</b></p>
                    <div style="padding: 15px; background: #F8FAF9; border-left: 4px solid #D63031;">
                        ${reason}
                    </div>
                </div>`
        });

        res.status(200).json({ success: true });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getFundraiserDonors = async (req, res) => {
  try {
    const { fundraiserObjectId } = req.params;
    const contributions = await UserContributedFundraiser.find({ fundraiserObjectId }).sort({ contributed_at: -1 }).lean();
    const users = await User.find({ userId: { $in: [...new Set(contributions.map(c => c.userId))] } }, 'userId name Ngoname').lean();
    res.status(200).json({ success: true, donorList: contributions.map(c => { const donor = users.find(u => u.userId === c.userId); return { name: donor ? (donor.name || donor.Ngoname) : "Anonymous", amount: c.amount_contributed, date: c.contributed_at }; }) });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getCarehomeDonors = async (req, res) => {
  try {
    const { carehomeId } = req.params;
    const donations = await DonationMoney.find({ carehomeId: parseInt(carehomeId) }).sort({ donated_at: -1 }).lean();
    const users = await User.find({ userId: { $in: [...new Set(donations.map(d => d.userId))] } }, 'userId name Ngoname').lean();
    res.status(200).json({ success: true, donorList: donations.map(d => { const donor = users.find(u => u.userId === d.userId); return { name: donor ? (donor.name || donor.Ngoname) : "Anonymous", amount: d.amount_donated, date: d.donated_at }; }) });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getEventRegistrations = async (req, res) => {
  try {
    const { eventObjectId } = req.params;
    const registrations = await UserRegisteredEvent.find({ eventObjectId }).lean();
    const users = await User.find({ userId: { $in: [...new Set(registrations.map(r => r.userId))] } }, 'userId name Ngoname').lean();
    res.status(200).json({ success: true, registrationList: registrations.map(r => { const user = users.find(u => u.userId === r.userId); return { name: user ? (user.name || user.Ngoname) : "User ID: " + r.userId, userId: r.userId, registeredAt: r.registered_at || r.createdAt || new Date() }; }) });
  } catch (error) { res.status(500).json({ success: false, message: "Could not retrieve participants" }); }
};

module.exports = {
  Getadmin,
  getAdminEventAnalytics,
  getAdminFundraiserAnalytics,
  getFundraiserDonors,
  getCarehomeDonors,
  getAdminDonationAnalytics,
  getEventRegistrations,
  getAllDonors,
  getDonorManagementStats,
  deleteDonorWithEmail,
  deleteNgoWithEmail,
  getNgoManagementStats, 
  getAllNgoManagement, 
  deleteCarehomeWithEmail, 
  getCarehomeManagementStats,
  getAllCarehomeManagement
};

