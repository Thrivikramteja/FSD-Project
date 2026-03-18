const path = require("path");
const bcrypt = require("bcrypt");

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

async function getCareHomesApi(req, res,next) {
  try {
    const carehomes = await Carehome.getCareHomes();
    res.json(carehomes);
  } catch (error) {
    error.message = "Failed to fetch carehomes";
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

async function insertMoney(req, res,next) {
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
    );

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    const user = await User.findOne({ userId: Number(application.userId) });
    const job = await CareHomeJob.findById(application.jobId);

    if (!user || !user.email || !job) {
      return res.status(400).json({ error: "User email or job details not found" });
    }

    try {
      const info = await sendRejectedEmail(user.email, user.name, job.title);
      console.log("Rejection Email sent:", info.messageId);
    } catch (err) {
      console.error("Rejection Email failed:", err);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Reject Action Error:", err);
    err.message = "Failed to process application rejection.";
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
    );

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    const user = await User.findOne({ userId: Number(application.userId) });
    
    if (!user || !user.email) {
      return res.status(400).json({ error: "User email not found" });
    }

    const job = await CareHomeJob.findById(application.jobId);
    if (!job) {
      return res.status(400).json({ error: "Job not found" });
    }

    try {
      await sendAcceptedEmail(user.email, user.name, job.title);
    } catch (err) {
      console.error("Email failed but status was updated:", err);
    }

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

async function get_don_items(req, res,next) {
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

  if (req.user.role !== "Carehome" || req.user.id !== careid) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const ongoing_fund = await Carehome.ongoing_fund(careid);
    const completed_fund = await Carehome.completed_fund(careid);
    const recentDonations = await Carehome.recentDonations(careid);
    const getname = await Carehome.getname(careid);
    const wishlist = await Carehome.getWishlist(careid);
    const stats = await Carehome.get_carehome_stats(careid);
    const items = await donate_items.get_item_donations(careid);

    const rawMessages = await Carehome.getMessages(careid);
    
    const messages = await enrichMessagesWithUser(rawMessages);

    res.json({
      name: getname.care_home_name,
      ongoing_fund,
      completed_fund,
      recentDonations,
      wishlist,
      careid,
      stats,
      messages,
      items,
      user: req.user,
      userRole: req.user.role,
    });
  } catch (err) {
    err.message = "Dashboard load failed";
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

async function get_alljobs(req, res,next) {
  try {
    const jobs = await CareHomeJob.find()
      .populate("postedBy", "care_home_name city state")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      jobs,
    });
  } catch (err) {
    console.error(err);
    err.message = "Server error";
    next(err);
  }
}


// Add this to carehome.controller.js
async function getCarehomePublic(req, res,next) {
  try {
    const careId = parseInt(req.params.carehomeId, 10);
    // Find by the numeric carehomeId
    const carehome = await Carehome.findOne({ carehomeId: careId });

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

async function getJobApplicants(req, res,next) {
  try {
    const { jobId } = req.params;

    const mongoId = await getMongoIdFromNumericId(req.user.id);

    if (!mongoId) {
      return res
        .status(404)
        .json({ success: false, message: "Carehome not found" });
    }

    const applications = await Application.find({
      jobId: jobId,
      carehomeId: mongoId,
    }).lean();

    const detailedApplicants = await Promise.all(
      applications.map(async (app) => {
        const user = await User.findOne({ userId: app.userId })
          .select("name email")
          .lean();
        return {
          ...app,
          userName: user ? user.name : "Unknown User",
          userEmail: user ? user.email : "N/A",
        };
      })
    );

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
    if (!req.user) {
      return res.status(401).json({ success: false });
    }

    const userId = req.user.id;

    const applications = await Application.find({ userId })
      .populate("jobId", "title")
      .populate("carehomeId", "care_home_name carehomeId")
      .sort({ appliedAt: -1 });

    const formatted = applications.map((app) => ({
      ...app.toObject(),
      carehomeName: app.carehomeId?.care_home_name || "Unknown",
    }));

    res.json({
      success: true,
      applications: formatted,
    });
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
