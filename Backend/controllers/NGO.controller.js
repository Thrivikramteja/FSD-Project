const path = require("path");
const bcrypt = require("bcrypt");
const redisClient = require('../redis'); // Path to the file you just created
const mongoose = require('mongoose');
const { NGO, Event } = require("../models/NGO.model");
const {
  CreatedFundraiser,
  UserRegisteredEvent,
} = require("../models/user.model");
const { Carehome } = require("../models/carehome.model");
const { nextTick } = require("process");
const {UserContributedFundraiser} = require('../models/user.model');

//We eliminated the N+1 query problem by using MongoDB aggregation with $lookup and optimized joins using projection pipelines.”
async function get_allngo(req, res, next) {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const cacheKey = `ngos:${q || 'all'}:p${page}`;

    // Redis Check
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }

    // Initialize Pipeline
    let pipeline = [];

    // 1. Search Logic (Must be first in pipeline)
    if (q) {
      if (q.length < 3) {
        pipeline.push({ $match: { Ngoname: { $regex: q, $options: 'i' } } });
      } else {
        pipeline.push({ $match: { $text: { $search: q } } });
        // Add score for relevance sorting
        pipeline.push({ $addFields: { score: { $meta: "textScore" } } });
        pipeline.push({ $sort: { score: -1 } });
      }
    } else {
      pipeline.push({ $sort: { Ngoname: 1 } });
    }

    // 2. Existing Optimized Aggregation Logic
    pipeline.push(
      { $skip: skip },
      { $limit: parseInt(limit) },
      { $project: { password: 0, otpCode: 0, otpExpires: 0, __v: 0 } },
      {
        $lookup: {
          from: "createdfundraisers",
          localField: "ngoId",
          foreignField: "ngoId",
          as: "fundraiserData"
        }
      },
      {
        $lookup: {
          from: "events",
          localField: "ngoId",
          foreignField: "ngoId",
          as: "eventData"
        }
      },
      {
        $addFields: {
          totalFundsRaised: { $sum: "$fundraiserData.amount_raised_so_far" },
          fundraisersCreated: { $size: "$fundraiserData" },
          totalRegistrations: { $sum: "$eventData.number_of_registrations" },
          careHomesBenefited: { 
            $size: { $setUnion: ["$fundraiserData.carehomeId", []] } 
          }
        }
      },
      { $project: { fundraiserData: 0, eventData: 0 } }
    );

    const enrichedNGOs = await NGO.aggregate(pipeline);

    const response = {
      success: true,
      page: parseInt(page),
      count: enrichedNGOs.length,
      data: enrichedNGOs
    };

    // Cache results
    await redisClient.setEx(cacheKey, 300, JSON.stringify(response));

    res.setHeader('X-Cache', 'MISS');
    res.json(response);
  } catch (err) {
    next(err);
  }
}

async function register(req, res, next) {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const ngo = new NGO({
      Ngoname: req.body.Ngoname,
      darpan_id: req.body.darpan_id,
      year_established: req.body.year_established,
      email: req.body.email,
      password: hashedPassword,
      phone: req.body.phone,
      address: req.body.address,
      account_holder_name: req.body.account_holder_name,
      account_number: req.body.account_number,
      ifsc: req.body.ifsc,
    });

    await ngo.save();

    return res.status(201).json({
      success: true,
      message: "NGO Registration successful",
    });
  } catch (error) {
    console.log(error);

    error.message = "Failed to register NGO";
    next(error);
  }
}

async function getEditNGOProfile(req, res, next) {
  const { ngoID } = req.params;

  if (req.user.role !== "NGO" || String(req.user.id) !== String(ngoID)) {
    return res.status(403).json({ success: false, message: "Forbidden: Identity mismatch." });
  }

  try {
    // 2. Optimization: findOne + Select + Lean
    // This stops the query immediately on finding a match and excludes sensitive data
    const ngo = await NGO.findOne({ ngoId: ngoID })
      .select("Ngoname phone account_holder_name account_number ifsc darpan_id")
      .lean();

    if (!ngo) {
      return res.status(404).json({ success: false, message: "NGO profile not found." });
    }

    // 3. Clean Response
    res.status(200).json({
      success: true,
      ngo: ngo,
    });
  } catch (error) {
    error.message = "Secure data retrieval failed.";
    next(error);
  }
}

async function getEvents(req, res, next) {
  try {
    const { q, page = 1, limit = 9 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cacheKey = `events:${q || 'all'}:p${page}`;

    // Redis
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }

    let query = { event_date: { $gte: today } };
    let projection = { description: 0, event_time: 0, __v: 0 };
    let sort = { event_date: 1 };

    // Hybrid Search Logic
    if (q) {
      if (q.length < 3) {
        query.event_name = { $regex: q, $options: 'i' };
      } else {
        query.$text = { $search: q };
        projection.score = { $meta: "textScore" };
        sort = { score: { $meta: "textScore" } };
      }
    }

    const events = await Event.find(query, projection)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Cache for 5 mins
    await redisClient.setEx(cacheKey, 300, JSON.stringify({ success: true, data: events }));

    res.setHeader('X-Cache', 'MISS');
    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
}

async function getallFundraisers(req, res, next) {
  try {
    const { q, tags } = req.query; // Inputs
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cacheKey = `fund:${q || 'all'}:${tags || 'none'}`; // Key

    const cached = await redisClient.get(cacheKey); // Cache-Check
    if (cached) {
      res.setHeader('X-Response-Source', 'Redis');
      return res.json(JSON.parse(cached));
    }

    let query = { deadline: { $gte: today } }; // Base
    let projection = { 
      fundraiser_name: 1, goal_amount: 1, amount_raised_so_far: 1, 
      deadline: 1, imagePath: 1, tag: 1, ngoId: 1 
    }; // Selection
    let sort = { deadline: 1 }; // Order

    if (q) {
      // Hybrid-Search
      if (q.length < 3) {
        query.fundraiser_name = { $regex: q, $options: 'i' }; // Partial
      } else {
        query.$text = { $search: q }; // Inverted-Index
        projection.score = { $meta: "textScore" };
        sort = { score: { $meta: "textScore" } }; // Ranking
      }
    }

    if (tags) {
      query.tag = { $in: tags.split(',') }; // Filtering
    }

    const fundraisers = await CreatedFundraiser.find(query, projection)
      .sort(sort)
      .lean(); // Performance

    await redisClient.setEx(cacheKey, 300, JSON.stringify(fundraisers)); // Store-Cache

    res.setHeader('X-Response-Source', 'Database');
    res.json(fundraisers);
  } catch (error) {
    next(error);
  }
}


async function editNGOProfile(req, res, next) {
  const ngoID = req.params.ngoID;
  console.log(req.user.id);

  if (req.user.role !== "NGO" || String(req.user.id) !== String(ngoID)) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Identity mismatch.",
    });
  }

  const { fullname, phone, bank, accnum, ifsc, darpan } = req.body;

  try {
    const updatedNGO = await NGO.findOneAndUpdate(
      { ngoId: ngoID },
      {
        $set: {
          Ngoname: fullname,
          darpan_id: darpan,
          phone: phone,
          account_holder_name: bank,
          account_number: accnum,
          ifsc: ifsc,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedNGO) {
      const err = new Error("NGO profile not found.");
      err.statusCode = 404;
      return next(err);
    }

    // --- PURGE REDIS CACHE ---
    // Clears the specific dashboard and the global NGO list to prevent stale data
    await Promise.all([
      redisClient.del(`dash:ngo:${ngoID}`),
      redisClient.del(`ngos:list`)
    ]);

    res.status(200).json({
      success: true,
      message: "NGO profile updated successfully.",
      ngo: updatedNGO,
    });
  } catch (error) {
    error.message = "Failed to update profile due to a server error.";
    next(error);
  }
}

async function createEvent(req, res, next) {
  const ngoID = req.params.ngoID;
  const cacheKey = `dash:ngo:${ngoID}`;

  if (req.user.role !== "NGO" || String(req.user.id) !== String(ngoID)) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: You do not have permission to create an event for this NGO",
    });
  }

  const { event_location, event_name, deadline, event_time, description } = req.body;

  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Event image is required" });
    }

    let imagePath = `/uploads/Events/${req.file.filename}`;

    const newEvent = new Event({
      ngoId: ngoID,
      event_name,
      event_location,
      event_date: new Date(deadline),
      event_time,
      description,
      number_of_registrations: 0,
      imagePath,
    });

    await newEvent.save();

    // --- CACHE PURGE ---
    await redisClient.del(cacheKey);

    res.status(200).json({
      success: true,
      message: "Event created successfully!",
    });
  } catch (error) {
    console.error("Event Creation Error:", error);
    error.message = "Failed to create event. Please try again later.";
    next(error);
  }
}

async function createFundraiser(req, res, next) {
  const ngoID = parseInt(req.params.ngoID, 10);
  const cacheKey = `dash:ngo:${ngoID}`; // Matches the key in getNGO

  if (req.user.role !== "NGO" || req.user.id !== ngoID) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const {
    fundraiser_name,
    deadline,
    goal_amount,
    description,
    id_carehome,
    tag,
  } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "Fundraiser image is required" 
      });
    }

    let imagePath = `/uploads/Fundraisers/${req.file.filename}`;

    const newFundraiser = new CreatedFundraiser({
      carehomeId: id_carehome,
      fundraiser_name,
      ngoId: ngoID,
      goal_amount: Number(goal_amount),
      description,
      amount_raised_so_far: 0,
      deadline: new Date(deadline),
      has_report: false,
      tag: tag || "General",
      imagePath,
    });

    await newFundraiser.save();

    // --- CACHE PURGE ---
    // Invalidate the NGO dashboard so the new fundraiser appears instantly
    await redisClient.del(cacheKey); 

    res.status(200).json({
      message: "Fundraiser created successfully",
      fundraiserId: newFundraiser._id,
    });
  } catch (error) {
    error.message = "Failed to create fundraiser";
    next(error);
  }
}

async function getEventDetails(req, res, next) {
  try {
    const { ngoID, eventName } = req.params;

    // 1. Find the event
    const event = await Event.findOne({ 
      ngoId: parseInt(ngoID, 10), 
      event_name: decodeURIComponent(eventName) 
    }).lean();

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    // 2. Optimization: Fetch only the NGO Name using the ID from the event
    const ngo = await NGO.findOne({ ngoId: event.ngoId })
      .select("Ngoname")
      .lean();

    res.status(200).json({ 
      success: true, 
      event: {
        ...event,
        ngoName: ngo ? ngo.Ngoname : "Trusted Partner" // Fallback if name is missing
      } 
    });
  } catch (error) {
    next(error);
  }
}

async function registerUser(req, res) {
  try {
    const { event } = req.body;
    const userId = req.user.id;
    const ngoId = req.params.ngoID;

    const createdEvent = await Event.findOne({
      event_name: event,
      ngoId,
    });

    if (!createdEvent) {
      return res.status(404).json({ message: "Event not found." });
    }

    const existingRegistration = await UserRegisteredEvent.findOne({
      userId,
      event_name: event,
      ngoId,
    });

    if (existingRegistration) {
      return res.status(400).json({
        message: "You have already registered for this event.",
      });
    }

    const userRegisteredEvent = new UserRegisteredEvent({
      userId,
      ngoId,
      event_name: event,
      event_date: createdEvent.event_date,
      event_location: createdEvent.event_location,
      eventObjectId: createdEvent._id,
    });

    await userRegisteredEvent.save();

    await Event.findOneAndUpdate(
      { ngoId, event_name: event },
      { $inc: { number_of_registrations: 1 } }
    );

    res
      .status(200)
      .json({ message: "Registration successful!", success: true });
  } catch (error) {
    error.message = "Internal server error.";
    next(error);
  }
}

async function getNGO(req, res, next) {
  const ngoID = parseInt(req.params.ngoID, 10);
  const cacheKey = `dash:ngo:${ngoID}`;

  if (req.user.role !== "NGO" || req.user.id !== ngoID) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    // Check Redis for existing dashboard snapshot
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }

    const today = new Date();

    // NGO basic info (//projection at high level)
    const ngo = await NGO.findOne({ ngoId: ngoID }, { Ngoname: 1 }).lean();
    if (!ngo) return res.status(404).json({ message: "NGO not found" });

    // Fundraisers (// Fundraisers (split at DB level) -> Now optimized to one trip)
    const allFundraisers = await CreatedFundraiser.find(
      { ngoId: ngoID }, 
      { fundraiser_name: 1, deadline: 1, tag: 1, goal_amount: 1, amount_raised_so_far: 1, carehomeId: 1 }
    ).lean();

    // Events (// Events (split at DB level) -> Now optimized to one trip)
    const allEvents = await Event.find(
      { ngoId: ngoID }, 
      { event_name: 1, event_date: 1, number_of_registrations: 1 }
    ).lean();

    // Stats (// Stats (minimal fetch) -> Calculated in-memory to save extra DB calls)
    const ongoing_fund = [];
    const completed_fund = [];
    let totalFundsRaised = 0;
    const careHomeIds = new Set();

    allFundraisers.forEach(f => {
      totalFundsRaised += (f.amount_raised_so_far || 0);
      if (f.carehomeId) careHomeIds.add(f.carehomeId.toString());
      
      if (new Date(f.deadline) >= today) ongoing_fund.push(f);
      else completed_fund.push(f);
    });

    const upcoming_eve = [];
    const completed_event = [];
    let totalRegistrations = 0;

    allEvents.forEach(e => {
      totalRegistrations += (e.number_of_registrations || 0);
      if (new Date(e.event_date) >= today) upcoming_eve.push(e);
      else completed_event.push(e);
    });

    const response = {
      name: ngo.Ngoname,
      ongoing_fund,
      completed_fund,
      completed_event,
      upcoming_eve,
      ngoID,
      stats: {
        totalFundsRaised,
        totalRegistrations,
        fundraisersCreated: allFundraisers.length,
        careHomesBenefited: careHomeIds.size
      },
      user: req.user,
      userRole: req.user.role
    };

    // Cache the processed dashboard for 5 minutes (300s)
    await redisClient.setEx(cacheKey, 300, JSON.stringify(response));
    res.setHeader('X-Cache', 'MISS');
    res.json(response);

  } catch (error) {
    error.message = "An error occurred while loading the dashboard";
    next(error);
  }
}

async function editEvent(req, res) {
  const ngoID = parseInt(req.params.ngoID, 10);

  if (req.user.role !== "NGO" || req.user.id !== ngoID) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const {
    event_object_id,
    original_event_name,
    new_event_name,
    event_location,
    event_date,
    event_time,
    description,
  } = req.body;

  try {
    await Event.findByIdAndUpdate(event_object_id, {
      event_name: new_event_name || original_event_name,
      event_location,
      event_date,
      event_time,
      description,
    });

    res.redirect(`/NGO-dashboard/${ngoID}`);
  } catch (error) {
    error.message = "Failed to update event";
    next(error);
  }
}

const getNGOProfileDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const ngo = await NGO.findOne({ ngoId: parseInt(id) }).lean();
    if (!ngo)
      return res.status(404).json({ success: false, message: "NGO not found" });

    const [rawFundraisers, events] = await Promise.all([
      CreatedFundraiser.find({ ngoId: parseInt(id) })
        .sort({ deadline: -1 })
        .lean(),
      Event.find({ ngoId: parseInt(id) })
        .sort({ event_date: 1 })
        .lean(),
    ]);

    const carehomeIds = [...new Set(rawFundraisers.map((f) => f.carehomeId))];
    const carehomes = await Carehome.find(
      { carehomeId: { $in: carehomeIds } },
      "carehomeId care_home_name"
    ).lean();

    const fundraisers = rawFundraisers.map((f) => {
      const home = carehomes.find((c) => c.carehomeId === f.carehomeId);
      return { ...f, carehomeName: home ? home.care_home_name : "Beneficiary Care Home" };
    });

    const now = new Date();

    const activeFundraisers = fundraisers.filter(
      (f) => new Date(f.deadline) >= now
    );
    const pastFundraisers = fundraisers.filter(
      (f) => new Date(f.deadline) < now
    );

    const upcomingEvents = events.filter((e) => new Date(e.event_date) >= now);
    const pastEvents = events.filter((e) => new Date(e.event_date) < now);

    res.status(200).json({
      success: true,
      data: {
        ngo,
        activeFundraisers,
        pastFundraisers,
        upcomingEvents,
        pastEvents,
      },
    });
  } catch (error) {
    console.error("NGO Profile Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};



async function getCampaignDetails(req, res, next) {
  const { ngoID, type, id } = req.params;

  if (!id || id === 'undefined' || !ngoID || ngoID === 'undefined') {
    return res.status(400).json({ success: false, message: "Invalid ID parameters." });
  }

  if (req.user.role !== "NGO" || String(req.user.id) !== String(ngoID)) {
    return res.status(403).json({ success: false, message: "Forbidden: Identity mismatch." });
  }

  try {
    let details = {};
    let participantsList = [];
    const targetId = new mongoose.Types.ObjectId(id);

    if (type === "fundraiser") {
      const fundraiser = await CreatedFundraiser.findOne({ _id: targetId, ngoId: parseInt(ngoID) }).lean();
      if (!fundraiser) return res.status(404).json({ success: false, message: "Fundraiser not found" });

      details = {
        name: fundraiser.fundraiser_name,
        description: fundraiser.description,
        totalRaised: fundraiser.amount_raised_so_far || 0,
        status: new Date(fundraiser.deadline) >= new Date() ? "Active" : "Completed",
      };

      // --- OPTIMIZED JOIN FOR DONORS ---
      participantsList = await UserContributedFundraiser.aggregate([
        { $match: { fundraiserObjectId: targetId } },
        {
          $lookup: {
            from: "donors",
            localField: "userId",
            foreignField: "userId",
            as: "donorInfo"
          }
        },
        { $unwind: "$donorInfo" },
        {
          $project: {
            _id: 0,
            userName: "$donorInfo.name",
            userEmail: "$donorInfo.email",
            amount: "$amount_contributed",
            timestamp: "$contributed_at"
          }
        },
        { $sort: { timestamp: -1 } }
      ]);

    } else if (type === "event") {
      const event = await Event.findOne({ _id: targetId, ngoId: parseInt(ngoID) }).lean();
      if (!event) return res.status(404).json({ success: false, message: "Event not found" });

      details = {
        name: event.event_name,
        description: event.description,
        participantCount: event.number_of_registrations || 0,
        status: new Date(event.event_date) >= new Date() ? "Upcoming" : "Completed",
      };

      // --- OPTIMIZED JOIN FOR PARTICIPANTS ---
      participantsList = await UserRegisteredEvent.aggregate([
        { $match: { eventObjectId: targetId } },
        {
          $lookup: {
            from: "donors",
            localField: "userId",
            foreignField: "userId",
            as: "participantInfo"
          }
        },
        { $unwind: "$participantInfo" },
        {
          $project: {
            _id: 0,
            userName: "$participantInfo.name",
            userEmail: "$participantInfo.email",
            timestamp: { $ifNull: ["$createdAt", "$event_date"] }
          }
        },
        { $sort: { timestamp: -1 } }
      ]);
    }

    res.status(200).json({ success: true, ...details, list: participantsList });
  } catch (error) {
    console.error("Fetch Details Error:", error);
    next(error);
  }
}

module.exports = {
  register,
  getNGO,
  createFundraiser,
  createEvent,
  getEditNGOProfile,
  editNGOProfile,
  editEvent,
  getEvents,
  get_allngo,
  getEventDetails,
  registerUser,
  getallFundraisers,
  getNGOProfileDetails,
  getCampaignDetails
};
