const path = require("path");
const bcrypt = require("bcrypt");
const redisClient = require('../redis'); // Path to the file you just created
const mongoose = require('mongoose');
const { Carehome } = require("../models/carehome.model");
const { DonationMoney, donate_items } = require("../models/carehome.model");
const { donate_items_mes, user_message } = require("../models/user.model");
const { CareHomeJob } = require("../models/carehome.model");
const Application = require("../models/Application");
const { User } = require("../models/user.model");
const {
  sendAcceptedEmail,
  sendRejectedEmail,
} = require("../services/otpService");

async function getMongoIdFromNumericId(numericId) {
  const carehome = await Carehome.findOne({ carehomeId: numericId });
  return carehome ? carehome._id : null;
}

async function getCareHomesApi(req, res, next) {
  try {
    const { q } = req.query; 
    const cacheKey = `carehomes:${q || 'all'}`;

    const cached = await redisClient.get(cacheKey); // Redis
    if (cached) {
      res.setHeader('X-Cache-Source', 'Redis');
      return res.json(JSON.parse(cached));
    }

    let query = {};
    let projection = { 
      care_home_name: 1, city: 1, state: 1, 
      description: 1, imagePath: 1, carehomeId: 1 
    }; // Projection
    let sort = { care_home_name: 1 };

    if (q) {
      if (q.length < 3) {
        query.care_home_name = { $regex: q, $options: 'i' }; // Partial
      } else {
        query.$text = { $search: q };
        projection.score = { $meta: "textScore" };
        sort = { score: { $meta: "textScore" } };
      }
    }

    const carehomes = await Carehome.find(query, projection)
      .sort(sort)
      .lean(); // Lean

    await redisClient.setEx(cacheKey, 300, JSON.stringify(carehomes)); // Cache

    res.setHeader('X-Cache-Source', 'Database');
    res.json(carehomes);
  } catch (error) {
    next(error);
  }
}

async function donateMoney(req, res,next) {
  try {
    const carehomes = await Carehome.getCareHomes();
    const selectedCareHomeId = req.query.carehome_id || null;

    res.render("carehomes/donate_money", {
      carehomes,
      selectedCareHomeId,
      user: req.user || null,
      userRole: req.user?.role || null,
    });
  } catch (error) {
    error.message = "Server Error";
    next(error);
  }
}

async function insertMoney(req, res, next) {
  try {
    const total = parseFloat(req.body.total);
    const userId = req.user.id;
    const carehomeId = parseInt(req.params.carehomeId, 10);

    if (!userId || isNaN(carehomeId) || isNaN(total) || total <= 0) {
      return res.status(400).json({
        message:
          "Missing or invalid data OR Login as user and try to donate money",
      });
    }

    const carehomeExists = await Carehome.findOne({ carehomeId: carehomeId });
    if (!carehomeExists) {
      return res.status(404).json({
        success: false,
        message: "Carehome not found",
      });
    }

    await DonationMoney.saveDonation({
      userId: userId,
      amount_donated: total,
      carehomeId: carehomeId,
      user: req.user,
      userRole: req.user.role,
    });

    res.status(200).json({
      success: true,
      message: "Your donation has been saved successfully!",
      redirectUrl: "/",
    });
  } catch (error) {
    console.error("Donation processing error:", error);
    error.message = "Internal server error while processing your donation.";
    next(error);
  }
}
async function register(req, res,next) {
  res.render("carehomes/care_reg");
}

async function rejectApplication(req, res, next) {
  const { id } = req.params;
  try {
    const application = await Application.findByIdAndUpdate(
      id,
      { status: "Rejected" },
      { new: true }
    )
    .populate("jobId", "title")
    .populate("carehomeId", "carehomeId")
    .lean();

    if (!application) return res.status(404).json({ error: "Application not found" });

    const user = await User.findOne({ userId: application.userId }, { email: 1, name: 1 }).lean();
    if (!user?.email) return res.status(400).json({ error: "User details not found" });

    // --- Targeted Cache Purge: Only for Dashboard routes ---
    const numericCareId = application.carehomeId?.carehomeId;
    await Promise.all([
      redisClient.del(`user:apps:${application.userId}`),
      redisClient.del(`dash:carehome:${numericCareId}`)
    ]);

    // Background Email
    sendRejectedEmail(user.email, user.name, application.jobId?.title)
      .catch(err => console.error("Background Email Error:", err));

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function acceptApplication(req, res, next) {
  const { id } = req.params;
  try {
    const application = await Application.findByIdAndUpdate(
      id,
      { status: "Accepted" },
      { new: true }
    )
    .populate("jobId", "title")
    .populate("carehomeId", "carehomeId")
    .lean();

    if (!application) return res.status(404).json({ error: "Application not found" });

    const user = await User.findOne({ userId: application.userId }, { email: 1, name: 1 }).lean();
    if (!user?.email) return res.status(400).json({ error: "User email not found" });

    // --- Targeted Cache Purge ---
    const numericCareId = application.carehomeId?.carehomeId;
    await Promise.all([
      redisClient.del(`user:apps:${application.userId}`),
      redisClient.del(`dash:carehome:${numericCareId}`)
    ]);

    // Background Email
    sendAcceptedEmail(user.email, user.name, application.jobId?.title)
      .catch(err => console.error("Background Email Error:", err));

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function donateItems(req, res,next) {
  try {
    const carehomes = await Carehome.getCareHomes();
    res.render("carehomes/donate_items", {
      carehomes,
      user: req.user || null,
      userRole: req.user?.role || null,
    });
  } catch (error) {
    error.message = "Server Error";
    next(error);
  }
}

async function get_don_items(req, res, next) {
  try {
    if (!req.user || req.user.role !== "Donor") {
      return res.status(403).json({
        success: false,
        message:
          "Access Denied: Only registered donors can submit item donation requests.",
      });
    }

    const carehomeId = parseInt(req.body.carehomes, 10);
    const category = req.body.category;
    const description = req.body.description || "";
    const location = req.body.address;
    const deliveryDate = new Date(req.body.date);
    const userId = req.user.id;

    if (!carehomeId || !category || !location || !deliveryDate || !userId) {
      return res.status(400).json({
        error: "All fields except description are required.",
      });
    }

    const carehomeExists = await Carehome.findOne({ carehomeId: carehomeId });
    if (!carehomeExists) {
      return res.status(404).json({
        success: false,
        message: "Carehome not found",
      });
    }

    const newDonationMessage = new donate_items_mes({
      carehomeId,
      userId,
      category,
      delivery_date: deliveryDate,
      location,
      description,
    });

    await newDonationMessage.save();

    res.status(200).json({
      success: true,
      message: "Your donation request has been sent successfully.",
    });
  } catch (err) {
    err.message = "Failed to save the donation message.";
    next(err);
  }
}

async function registerCarehome(req, res,next) {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  let imagePath = null;
  if (req.file) {
    imagePath = `/uploads/Carehomes/${req.file.filename}`;
  }

  try {
    const carehome = new Carehome({
      care_home_name: req.body.care_home_name,
      reg_number: req.body.reg_number,
      email: req.body.email,
      password: hashedPassword,
      contact: req.body.contact,
      state: req.body.state,
      city: req.body.city,
      num_residents: req.body.num_residents,
      avg_expense: req.body.avg_expense,
      wishlist: req.body.wishlist,
      description: req.body.description,
      account_holder: req.body.account_holder,
      account_number: req.body.account_number,
      ifsc: req.body.ifsc,
      terms: req.body.terms,
      imagePath,
    });

    await carehome.save();

    res.status(200).json({
      message: "Carehome Registration successful",
    });
  } catch (err) {
    err.message = "Registration failed";
    next(err);
  }
}

const enrichMessagesWithUser = async (messages) => {
  return Promise.all(
    messages.map(async (msg) => {

      const user = await User.findOne({ userId: msg.userId })
        .select("name mobile_number -_id")
        .lean();
        
      return {
        ...msg.toObject(), 
        userName: user ? user.name : "Anonymous Donor",
        userPhone: user ? user.mobile_number : "N/A"
      };
    })
  );
};

async function getCarehome(req, res, next) {
  const careid = parseInt(req.params.carehomeId, 10);

  // Security Check
  if (req.user.role !== "Carehome" || req.user.id !== careid) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const cacheKey = `dash:carehome:${careid}`;

    // 1. Redis Check
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      res.setHeader('X-Cache-Status', 'HIT');
      return res.json(JSON.parse(cachedData));
    }

    // 2. Parallel Execution (Optimization: No Waterfall)
    const [
      careData,
      ongoing_fund,
      completed_fund,
      recentDonations,
      stats,
      items,
      rawMessages
    ] = await Promise.all([
      Carehome.findOne({ carehomeId: careid }, { care_home_name: 1, wishlist: 1 }).lean(),
      Carehome.ongoing_fund(careid),
      Carehome.completed_fund(careid),
      Carehome.getRecentDonationsOptimized(careid), // New Optimized Static
      Carehome.get_carehome_stats_optimized(careid), // New Optimized Static
      donate_items.get_item_donations(careid),
      Carehome.getMessages(careid)
    ]);

    // 3. Enrichment (Keeping your existing logic)
    const messages = await enrichMessagesWithUser(rawMessages);

    const dashboardResponse = {
      name: careData?.care_home_name || "Carehome",
      ongoing_fund,
      completed_fund,
      recentDonations,
      wishlist: careData?.wishlist || "",
      careid,
      stats,
      messages,
      items,
      user: req.user,
      userRole: req.user.role,
    };

    // 4. Cache for 2 minutes (Dashboards change often, so short TTL)
    await redisClient.setEx(cacheKey, 120, JSON.stringify(dashboardResponse));

    res.setHeader('X-Cache-Status', 'MISS');
    res.json(dashboardResponse);
  } catch (err) {
    next(err);
  }
}

async function accpet_item_doantions(req, res,next) {
  try {
    // Safety Check: Identity & Role
    if (
      req.user.role !== "Carehome" ||
      String(req.user.id) !== String(req.body.carehomeId)
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: Identity mismatch" });
    }

    const {
      action,
      carehomeId,
      category,
      delivery_date,
      location,
      description,
      userId,
    } = req.body;

    // 1. Move to permanent records if accepted
    if (action === "accept") {
      await new donate_items({
        userId,
        carehomeId,
        category,
        delivery: delivery_date,
        description,
        location,
        donated_at: Date.now(),
      }).save();
    }

    // 2. Remove the request from the "Inbox"
    await donate_items_mes.findOneAndDelete({
      userId,
      carehomeId,
      category,
      location,
    });

    // 3. Notify the donor
    await new user_message({
      carehomeId,
      userId,
      message:
        action === "accept"
          ? "Your donation request was approved!"
          : "Your donation request was declined.",
      category,
      delivery: delivery_date,
      when_date: Date.now(),
    }).save();

    res.json({ success: true, message: `Request ${action}ed successfully.` });
  } catch (err) {
    console.error(err);
    err.message = "Internal server error";
    next(err);
  }
}
async function editCarehomeProfile(req, res,next) {
  const careId = parseInt(req.params.carehomeId, 10);

  if (req.user.role !== "Carehome" || req.user.id !== careId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const {
    fullname,
    phne,
    state,
    city,
    mail,
    gvtid,
    bank,
    accnum,
    ifsc,
    wishlist,
  } = req.body;

  try {
    const updatedCarehome = await Carehome.findOneAndUpdate(
      { carehomeId: careId },
      {
        care_home_name: fullname,
        contact: phne,
        state,
        city,
        email: mail,
        reg_number: gvtid,
        account_holder: bank,
        account_number: accnum,
        ifsc,
        wishlist,
      },
      { new: true }
    );

    if (!updatedCarehome) {
      return res
        .status(404)
        .json({ message: "Care Home not found for update." });
    }

    res.status(200).json({
      success: true,
      message: "Care Home details updated successfully.",
      carehome: updatedCarehome,
    });
  } catch (err) {
    err.message = "Server error occurred while updating the profile.";
    next(err);
  }
}

async function getCarehomeProfile(req, res,next) {
  const careId = parseInt(req.params.carehomeId, 10);

  if (req.user.role !== "Carehome" || req.user.id !== careId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const carehome = await Carehome.findOne(
      { carehomeId: careId },
      "care_home_name contact email ifsc"
    );

    if (!carehome) {
      return res.status(404).json({ message: "Carehome not found" });
    }

    res.status(200).json(carehome);
  } catch (err) {
    err.message = "Server error";
    next(err);
  }
}

// Helper to resolve numeric Carehome ID to MongoDB ObjectId
async function getMongoIdFromNumericId(numericId) {
  const carehome = await Carehome.findOne({ carehomeId: numericId });
  return carehome ? carehome._id : null;
}

async function post_createjob(req, res,next) {
  try {
    if (!req.user || req.user.role !== "Carehome") {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Only Carehomes can post job listings.",
      });
    }

    const { title, description, location, pay, type, startDate, endDate } =
      req.body;

    if (!title || !description || !pay) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and pay are required fields.",
      });
    }

    // 1. RESOLVE THE PROMISE HERE FIRST
    const mongoId = await getMongoIdFromNumericId(req.user.id);

    if (!mongoId) {
      return res.status(404).json({
        success: false,
        message: "Carehome record not found.",
      });
    }

    // 2. PASS THE RESOLVED mongoId TO THE SCHEMA
    const job = new CareHomeJob({
      postedBy: mongoId,
      title,
      description,
      location,
      pay,
      type,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    });

    await job.save();

    return res.status(201).json({
      success: true,
      message: "Job listing published successfully!",
      redirectUrl: `/carehome-dashboard/${req.user.id}`,
    });
  } catch (error) {
    console.error("Create Job Error:", error);
    error.message = "An internal server error occurred while creating the job.";
    next(error);
  }
}

async function get_alljobs(req, res, next) {
  try {
    const { q, types } = req.query; // types is a comma-separated string
    const cacheKey = `jobs:search:${q || 'none'}:types:${types || 'all'}`;

    // 1. Redis Cache Check
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }

    let query = {};
    let projection = { __v: 0 };
    let sort = { createdAt: -1 };

    // 2. Hybrid Search Logic
    if (q) {
      if (q.length < 3) {
        query.title = { $regex: q, $options: 'i' };
      } else {
        query.$text = { $search: q };
        projection.score = { $meta: "textScore" };
        sort = { score: { $meta: "textScore" } };
      }
    }

    // 3. Multi-Select Filtering
    if (types) {
      query.type = { $in: types.split(',') }; 
    }

    // 4. Execution with Projections and Lean
    const jobs = await CareHomeJob.find(query, projection)
      .populate("postedBy", "care_home_name city state")
      .sort(sort)
      .lean();

    const response = { success: true, jobs };

    // 5. Set Cache (5 minutes)
    await redisClient.setEx(cacheKey, 300, JSON.stringify(response));

    res.setHeader('X-Cache', 'MISS');
    res.json(response);
  } catch (err) {
    next(err);
  }
}


// Add this to carehome.controller.js
async function getCarehomePublic(req, res, next) {
  try {
    const careId = parseInt(req.params.carehomeId, 10);

    const carehome = await Carehome.findOne(
      { carehomeId: careId },
      {
        care_home_name: 1,
        imagePath: 1,
        description: 1,
        num_residents: 1,
        avg_expense: 1,
        city: 1,
        state: 1,
        _id: 0 
      }
    ).lean();

    if (!carehome) {
      return res.status(404).json({ error: "Care home not found" });
    }

    res.json(carehome);
  } catch (error) {
    console.error(error);
    error.message = "Internal server error";
    next(error);
  }
}

// Remember to add getCarehomePublic to the module.exports at the end of the file!

// Helper to resolve numeric IDs to MongoDB ObjectIds
async function getMongoIdFromNumericId(numericId) {
  const carehome = await Carehome.findOne({ carehomeId: numericId });
  return carehome ? carehome._id : null;
}

async function getCareHome_Jobs(req, res,next) {
  try {
    // 1. Verify Authentication
    if (!req.user || req.user.role !== "Carehome") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // 2. Resolve numeric JWT ID to MongoDB ObjectId
    const mongoId = await getMongoIdFromNumericId(req.user.id);

    if (!mongoId) {
      return res
        .status(404)
        .json({ success: false, message: "Carehome record not found" });
    }

    // 3. Fetch jobs using the resolved ObjectId
    const jobs = await CareHomeJob.find({ postedBy: mongoId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      jobs: jobs,
    });
  } catch (error) {
    console.error("Error in getCareHomeJobs:", error);
    error.message = "Server error";
    next(error);
  }
}

async function getJobApplicants(req, res, next) {
  try {
    const { jobId } = req.params;
    const mongoId = await getMongoIdFromNumericId(req.user.id);

    if (!mongoId) {
      return res.status(404).json({ success: false, message: "Carehome not found" });
    }

    // Single Aggregation Pipeline to avoid N+1 queries
    const detailedApplicants = await Application.aggregate([
      {
        $match: {
          jobId: new mongoose.Types.ObjectId(jobId),
          carehomeId: mongoId,
        },
      },
      {
        $lookup: {
          from: "donors",
          localField: "userId",
          foreignField: "userId",
          as: "userDetails",
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          status: 1,
          experience: 1,
          whyMe: 1,
          appliedAt: 1,
          userName: { $ifNull: ["$userDetails.name", "Unknown User"] },
          userEmail: { $ifNull: ["$userDetails.email", "N/A"] },
        },
      },
      { $sort: { appliedAt: -1 } },
    ]);

    res.status(200).json({
      success: true,
      applicants: detailedApplicants,
    });
  } catch (error) {
    console.error("Error fetching job applicants:", error);
    error.message = "Server error";
    next(error);
  }
}

async function getMyApplications(req, res, next) {
  try {
    const userId = req.user.id;
    const cacheKey = `user:apps:${userId}`;
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }

    const applications = await Application.find({ userId }, { __v: 0 })
      .populate("jobId", "title")
      .populate("carehomeId", "care_home_name carehomeId")
      .sort({ appliedAt: -1 })
      .lean();

    const formatted = applications.map(app => ({
      ...app,
      carehomeName: app.carehomeId?.care_home_name || "Unknown"
    }));

    const response = { success: true, applications: formatted };
    await redisClient.setEx(cacheKey, 180, JSON.stringify(response));

    res.setHeader('X-Cache', 'MISS');
    res.json(response);
  } catch (err) {
    next(err);
  }
}

const ImpactStory = require('../models/ImpactStory');

async function createImpactStory(req, res, next) {
  try {
    if (!req.user || req.user.role !== 'Carehome') {
      return res.status(403).json({ message: 'Only carehomes can create stories' });
    }
    const { title, description } = req.body;
    
    // Convert full file paths to relative URLs
    const images = req.files
      .filter(file => file.mimetype.startsWith('image/'))
      .map(file => file.path.replace(/\\/g, '/').split('public/')[1] || file.path);
    
    const videos = req.files
      .filter(file => file.mimetype.startsWith('video/'))
      .map(file => file.path.replace(/\\/g, '/').split('public/')[1] || file.path);
    
    const mongoId = await getMongoIdFromNumericId(req.user.id);
    if (!mongoId) {
      return res.status(404).json({ message: 'Carehome not found' });
    }
    const story = new ImpactStory({ carehomeId: mongoId, title, description, images, videos });
    await story.save();
    res.json({ success: true, story });
  } catch (error) {
    console.error('Create impact story error:', error);
    next(error);
  }
}

async function getImpactStories(req, res, next) {
  try {
    const stories = await ImpactStory.find().populate('carehomeId', 'care_home_name city');
    res.json({ success: true, stories });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  donateMoney,
  register,
  donateItems,
  registerCarehome,
  getCarehome,
  getCareHomesApi,
  insertMoney,
  accpet_item_doantions,
  get_don_items,
  editCarehomeProfile,
  getCarehomeProfile,
  post_createjob,
  get_alljobs,
  getCareHome_Jobs,
  getJobApplicants,
  getCarehomePublic,
  createImpactStory,
  getImpactStories,
  rejectApplication,
  acceptApplication,
  getMyApplications,
};
