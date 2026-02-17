const path = require("path");
const bcrypt = require("bcrypt");

const { NGO, Event } = require("../models/NGO.model");
const {
  CreatedFundraiser,
  UserRegisteredEvent,
} = require("../models/user.model");
const { Carehome } = require("../models/carehome.model");
const { nextTick } = require("process");

function getRegister(req, res) {
  res.render("NGOs/ngo_registration");
}

async function get_allngo(req, res) {
  try {
    const NGOs = await NGO.get_all_ngos();

    const enrichedNGOs = await Promise.all(
      NGOs.map(async (ngo) => {
        const totalFundsRaised = await NGO.get_rev(ngo.ngoId);
        const totalRegistrations = await NGO.tot_reg(ngo.ngoId);
        const fundraisersCreated = await NGO.fund_created(ngo.ngoId);
        const careHomesBenefited = await NGO.benifit_care(ngo.ngoId);

        return {
          ...ngo.toObject(),
          totalFundsRaised:
            totalFundsRaised.length > 0 ? totalFundsRaised[0].total : 0,
          totalRegistrations:
            totalRegistrations.length > 0 ? totalRegistrations[0].total : 0,
          fundraisersCreated,
          careHomesBenefited,
        };
      })
    );

    res.json(enrichedNGOs);
  } catch (err) {
    err.message = "Failed to fetch NGOs"
    nextTick(err)
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
    const ngoID = req.params.ngoID; 
    console.log("hi myy name is ngo " + ngoID);
    // 1. THE DRILL: Force string comparison to avoid type mismatch
    if (req.user.role !== "NGO" || String(req.user.id) !== String(ngoID)) {
        return res.status(403).json({ 
            success: false, 
            message: "Forbidden: Identity mismatch." 
        });
    }

    try {
        const ngoArray = await NGO.getNGOById(ngoID);
        console.log("hi i am from controller " + ngoArray);

        const ngo = ngoArray && ngoArray.length > 0 ? ngoArray[0] : null;
        
        if (!ngo) {
            const err = new Error("NGO profile not found.");
            err.statusCode = 404;
            return next(err);
        }

        res.status(200).json({
            success: true,
            ngo: ngo 
        });

    } catch (error) {
        error.message = "Secure data retrieval failed.";
        next(error); 
    }
}

async function getEvents(req, res) {
  try {
    const cur = new Date();
    cur.setHours(0, 0, 0, 0);
    const events = await Event.find({ event_date: { $gte: cur } });

    res.json(events);
  } catch (error) {
    error.message = "Failed to load events"
    nextTick(error);
  }
}

async function getFundraisers(req, res) {
  const ngoID = parseInt(req.params.ngoID, 10);

  if (req.user.role !== "NGO" || req.user.id !== ngoID) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const today = new Date();
    const isoCurrentDate = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const fundraisers = await CreatedFundraiser.find({ ngoId: ngoID });
    const ongoing_fund = fundraisers.filter((fundraiser) => {
      const deadline =
        fundraiser.deadline instanceof Date
          ? fundraiser.deadline.toISOString().split("T")[0]
          : fundraiser.deadline;
      return deadline >= isoCurrentDate;
    });

    res.render("NGOs/fundraisers", {
      ongoing_fund,
      user: req.user,
      userRole: req.user.role,
    });
  } catch (error) {
    error.message = "Failed to load fundraisers"
    next(error);
  }
}

async function getallFundraisers(req, res) {
  try {
    const today = new Date();
    const isoCurrentDate = today.toISOString().split("T")[0];

    const fundraisers = await CreatedFundraiser.find({});

    const ongoing_fund = fundraisers.filter((fundraiser) => {
      const deadline =
        fundraiser.deadline instanceof Date
          ? fundraiser.deadline.toISOString().split("T")[0]
          : fundraiser.deadline;
      return deadline >= isoCurrentDate;
    });

    res.json(ongoing_fund);
  } catch (error) {
    error.message = "Failed to load fundraisers";
    next(error);
  }
}


async function editNGOProfile(req, res, next) {
    
    const ngoID = req.params.ngoID;
    console.log(req.user.id);

    if (req.user.role !== "NGO" || String(req.user.id) !== String(ngoID)) {
        return res.status(403).json({ 
            success: false, 
            message: "Forbidden: Identity mismatch." 
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
                }
            },
            { new: true, runValidators: true } 
        );

        if (!updatedNGO) {
            const err = new Error("NGO profile not found.");
            err.statusCode = 404;
            return next(err);
        }

        
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

async function createEvent(req, res) {
  const ngoID = req.params.ngoID;

  if (req.user.role !== "NGO" || String(req.user.id) !== String(ngoID)) {
    return res.status(403).json({
      success: false,
      message:
        "Forbidden: You do not have permission to create an event for this NGO",
    });
  }

  const { event_location, event_name, deadline, event_time, description } =
    req.body;

  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Event image is required" });
    }

    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/Events/${req.file.filename}`;
    }

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

async function createFundraiser(req, res) {
  const ngoID = parseInt(req.params.ngoID, 10);

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
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/Fundraisers/${req.file.filename}`;
    }

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

    res.status(200).json({
      message: "Fundraiser created successfully",
      fundraiserId: newFundraiser._id,
    });
  } catch (error) {
    error.message  = "Failed to create fundraiser";
    next(error);
  }
}

function getRegisterUser(req, res) {
  const event = req.params.eventName;
  const ngoId = req.params.ngoID;

  res.render("users/donor_reg", {
    event,
    ngoId,
    user: req.user,
    userRole: req.user.role,
  });
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
   error.message =  "Internal server error."
   next(error);
  }
}

async function rendercreatefundraiser(req, res) {
  const ngoID = parseInt(req.params.ngoID, 10);

  if (req.user.role !== "NGO" || req.user.id !== ngoID) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const carehomes = await Carehome.find({});

    res.render("NGOs/create_fundraiser", {
      ngoID,
      care: carehomes,
    });
  } catch (error) {
    error.message = "Failed to load the Create Fundraiser form";
    next(error);
  }
}

async function render_donate_fundraiser(req, res) {
  const ngoId = parseInt(req.params.ngoId, 10);
  const name_fund = req.params.fundraiser_name;

  res.render("NGOs/donate_fundraiser", {
    ngoId,
    name_fund,
    user: req.user,
    userRole: req.user.role,
  });
}

async function getNGO(req, res) {
  const ngoID = parseInt(req.params.ngoID, 10);

  if (req.user.role !== "NGO" || req.user.id !== ngoID) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const ngo = await NGO.findOne({ ngoId: ngoID });

    if (!ngo) {
      return res.status(404).json({ message: "NGO not found" });
    }

    const name = ngo.Ngoname;

    const today = new Date();
    const isoCurrentDate = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const fundraisers = await CreatedFundraiser.find({ ngoId: ngoID });

    const ongoing_fund = fundraisers.filter((f) => {
      const d =
        f.deadline instanceof Date
          ? f.deadline.toISOString().split("T")[0]
          : f.deadline;
      return d >= isoCurrentDate;
    });

    const completed_fund = fundraisers.filter((f) => {
      const d =
        f.deadline instanceof Date
          ? f.deadline.toISOString().split("T")[0]
          : f.deadline;
      return d < isoCurrentDate;
    });

    const events = await Event.find({ ngoId: ngoID });

    const upcoming_eve = events.filter((e) => {
      const d =
        e.event_date instanceof Date
          ? e.event_date.toISOString().split("T")[0]
          : e.event_date;
      return d >= isoCurrentDate;
    });

    const completed_event = events.filter((e) => {
      const d =
        e.event_date instanceof Date
          ? e.event_date.toISOString().split("T")[0]
          : e.event_date;
      return d < isoCurrentDate;
    });

    const stats = {
      totalFundsRaised: fundraisers.reduce(
        (s, f) => s + (f.funds_raised || 0),
        0
      ),
      totalRegistrations: events.reduce(
        (s, e) => s + (e.number_of_registrations || 0),
        0
      ),
      fundraisersCreated: fundraisers.length,
      careHomesBenefited: new Set(
        fundraisers.map((f) => f.id_carehome).filter(Boolean)
      ).size,
    };

    res.json({
      name,
      ongoing_fund,
      completed_fund,
      completed_event,
      upcoming_eve,
      ngoID,
      stats,
      user: req.user,
      userRole: req.user.role,
    });
  } catch (error) {
    error.message = "An error occurred while loading the dashboard"
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

async function renderEditEvent(req, res) {
  const ngoID = parseInt(req.params.ngoID, 10);

  if (req.user.role !== "NGO" || req.user.id !== ngoID) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const events = await Event.specific_events(ngoID);
    const eventDetails = {};

    for (const event of events) {
      const details = await Event.event_load(ngoID, event.event_name);
      eventDetails[event.event_name] = details;
    }

    res.render("NGOs/edit_events", {
      ngoID,
      events,
      eventDetails: JSON.stringify(eventDetails),
      user: req.user,
      userRole: req.user.role,
    });
  } catch (error) {
    error.message = "Failed to load the Edit Event form";
    next(error);
  }
}

//ngo profile
// controller function
// controllers/ngoController.js

const getNGOProfileDetails = async (req, res) => {
    const { id } = req.params; 

    try {
      
        const ngo = await NGO.findOne({ ngoId: parseInt(id) }).lean();
        if (!ngo) return res.status(404).json({ success: false, message: "NGO not found" });

        const [rawFundraisers, events] = await Promise.all([
            CreatedFundraiser.find({ ngoId: parseInt(id) }).sort({ deadline: -1 }).lean(),
            Event.find({ ngoId: parseInt(id) }).sort({ event_date: 1 }).lean()
        ]);

    
        const carehomeIds = [...new Set(rawFundraisers.map(f => f.carehomeId))];
        const carehomes = await Carehome.find({ carehomeId: { $in: carehomeIds } }, 'carehomeId name').lean();
        
        const fundraisers = rawFundraisers.map(f => {
            const home = carehomes.find(c => c.carehomeId === f.carehomeId);
            return { ...f, carehomeName: home ? home.name : "Beneficiary Care Home" };
        });

        const now = new Date();


        const activeFundraisers = fundraisers.filter(f => new Date(f.deadline) >= now);
        const pastFundraisers = fundraisers.filter(f => new Date(f.deadline) < now);

        const upcomingEvents = events.filter(e => new Date(e.event_date) >= now);
        const pastEvents = events.filter(e => new Date(e.event_date) < now);

        res.status(200).json({
            success: true,
            data: {
                ngo,
                activeFundraisers,
                pastFundraisers,
                upcomingEvents,
                pastEvents
            }
        });

    } catch (error) {
        console.error("NGO Profile Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = {
  getRegister,
  register,
  getNGO,
  rendercreatefundraiser,
  createFundraiser,
  createEvent,
  getEditNGOProfile,
  editNGOProfile,
  renderEditEvent,
  editEvent,
  getEvents,
  getFundraisers,
  get_allngo,
  getRegisterUser,
  registerUser,
  getallFundraisers,
  render_donate_fundraiser,
  getNGOProfileDetails,
};
