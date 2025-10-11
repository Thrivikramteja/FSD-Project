const path = require("path");

const { NGO, Event } = require("../models/NGO.model");
const {
  CreatedFundraiser,
  UserRegisteredEvent,
} = require("../models/user.model");
const { Carehome } = require("../models/carehome.model");

function getRegister(req, res) {
  res.render("NGOs/ngo_registration");
}

async function get_allngo(req, res) {
  try {
    // Fetch all NGOs
    const NGOs = await NGO.get_all_ngos();

    // Enrich NGOs with additional data
    const enrichedNGOs = await Promise.all(
      NGOs.map(async (ngo) => {
        const totalFundsRaised = await NGO.get_rev(ngo.ngoId); // Get total funds raised
        const totalRegistrations = await NGO.tot_reg(ngo.ngoId); // Get total registrations
        const fundraisersCreated = await NGO.fund_created(ngo.ngoId); // Get fundraisers count
        const careHomesBenefited = await NGO.benifit_care(ngo.ngoId); // Get care homes count

        return {
          ...ngo.toObject(), // Convert Mongoose document to plain object
          totalFundsRaised: totalFundsRaised.length > 0 ? totalFundsRaised[0].total : 0,
          totalRegistrations: totalRegistrations.length > 0 ? totalRegistrations[0].total : 0,
          fundraisersCreated,
          careHomesBenefited,
        };
      })
    );

    // Render the EJS view with enriched NGO data
    res.render("NGOs/allngos", {
      ngos: enrichedNGOs,
      user: req.session.user,
      userRole: req.session.userRole,
    });
  } catch (err) {
    console.error("Error while fetching NGOs:", err);
    res.status(500).send("Failed to fetch NGOs");
  }
}


async function register(req, res) {
  try {
    const {
      Ngoname,
      darpan_id,
      year_established,
      email,
      password,
      phone,
      address,
      account_holder_name,
      account_number,
      ifsc,
    } = req.body;

    const ngo = new NGO({
      Ngoname,
      darpan_id,
      year_established,
      email,
      password,
      phone,
      address,
      account_holder_name,
      account_number,
      ifsc,
    });

    await ngo.storeNGO();
    console.log("stored succesfully ");
    res.redirect("/login");
  } catch (error) {
    console.error("Error in register controller:", error);
    res.status(500).send("Failed to register NGO");
  }
}

async function getEditNGOProfile(req, res) {
  const ngoID = parseInt(req.params.ngoID, 10);

  try {
    const ngo = await NGO.getNGOById(ngoID);

    if (!ngo) {
      return res.status(404).send("NGO not found");
    }

    res.render("NGOs/ngo_edit", {
      ngoID,
      ngo,
      user: req.session.user,
      userRole: req.session.userRole,
    });
  } catch (error) {
    console.error("Error getting NGO profile:", error);
    res.status(500).send("Failed to load NGO profile");
  }
}

async function getEvents(req, res) {
  try {
    const cur = new Date();
    cur.setHours(0, 0, 0, 0); 
    const events = await Event.find({ event_date: { $gte: cur } });
    res.render("NGOs/events", {
      upcoming_eve: events,
      user: req.session.user,
      userRole: req.session.userRole,
    });
  } catch (error) {
    console.error("Error fetching upcoming events ", error);
    res.staus(500).send("Failed to load events ");
  }
}

async function getFundraisers(req, res) {
  const ngoID = parseInt(req.params.ngoID, 10);

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
      user: req.session.user,
      userRole: req.session.userRole,
    });
  } catch (error) {
    console.error("Error fetching fundraisers:", error);
    res.status(500).send("Failed to load fundraisers");
  }
}

async function getallFundraisers(req, res) {
  try {
    const today = new Date();
    const isoCurrentDate = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const fundraisers = await CreatedFundraiser.find({});

    const ongoing_fund = fundraisers.filter((fundraiser) => {
      const deadline =
        fundraiser.deadline instanceof Date
          ? fundraiser.deadline.toISOString().split("T")[0]
          : fundraiser.deadline;
      return deadline >= isoCurrentDate;
    });

    res.render("NGOs/fundraisers", {
      ongoing_fund,
      user: req.session.user,
      userRole: req.session.userRole,
    });
  } catch (error) {
    console.error("Error fetching fundraisers:", error);
    res.status(500).send("Failed to load fundraisers");
  }
}

async function editNGOProfile(req, res) {
  const ngoID = parseInt(req.params.ngoID, 10);

  if (isNaN(ngoID)) {
    return res.status(400).send("Invalid NGO ID");
  }

  const { fullname, phone, bank, accnum, ifsc, darpan } = req.body;

  try {
    const updatedNGO = await NGO.findOneAndUpdate(
      { ngoId: ngoID },
      {
        Ngoname: fullname,
        darpan_id: darpan,
        phone,
        account_holder_name: bank,
        account_number: accnum,
        ifsc,
      },
      { new: true }
    );

    if (!updatedNGO) {
      return res.status(404).send("NGO not found");
    }

    res.redirect(`/NGO-dashboard/${ngoID}`);
  } catch (error) {
    console.error("Error updating NGO profile:", error);
    res.status(500).send("Server error");
  }
}

function renderCreateEventForm(req, res) {
  const ngoID = parseInt(req.params.ngoID, 10);

  try {
    res.render("NGOs/create_event", {
      ngoID,
      user: req.session.user,
      userRole: req.session.userRole,
    });
  } catch (error) {
    console.error("Error rendering the Create Event form:", error);
    res.status(500).send("Failed to load the Create Event form");
  }
}

async function createEvent(req, res) {
  const ngoID = parseInt(req.params.ngoID, 10);
  const { event_location, event_name, deadline, event_time, description } =
    req.body;

  try {
    if (!ngoID || !event_name || !deadline || !event_time) {
      return res.status(400).send("Missing required fields");
    }

    const newEvent = new Event({
      ngoId: ngoID,
      event_name,
      event_location,
      event_date: new Date(deadline),
      event_time,
      description,
      number_of_registrations: 0,
      imagePath: req.file.path
    });

    await newEvent.save();

    console.log("New Event Created:", newEvent);
    res.redirect(`/NGO-dashboard/${ngoID}`);
  } catch (error) {
    console.error("Error in createEvent controller:", error);
    res.status(500).send("Failed to create event");
  }
}

async function createFundraiser(req, res) {
  const ngoID = parseInt(req.params.ngoID, 10);
  const { fundraiser_name, deadline, goal_amount, description, id_carehome } =
    req.body;

    console.log(ngoID);
    console.log(fundraiser_name);
    console.log(deadline);
    console.log(goal_amount);
  try {
    if (!ngoID || !fundraiser_name || !deadline || !goal_amount) {
      return res.status(400).send("Missing required fields");
    }

    let imagePath = req.file.path
      .split(path.sep)       
      .slice(-3)             
      .join("/");
    const newFundraiser = new CreatedFundraiser({     
      carehomeId: id_carehome,
      fundraiser_name,
      ngoId: ngoID,
      goal_amount: Number(goal_amount),
      description,
      amount_raised_so_far: 0,     
      deadline: new Date(deadline),
      imagePath: imagePath
    });

    await newFundraiser.save();

    console.log("New Fundraiser Created:", newFundraiser);
    res.redirect(`/NGO-dashboard/${ngoID}`);
  } catch (error) {
    console.error("Error in createFundraiser controller:", error);
    res.status(500).send("Failed to create fundraiser");
  }
}

function getRegisterUser(req, res) {
  const event = req.params.eventName;
  const ngoId = req.params.ngoID;
  res.render("users/donor_reg", {
    event,
    ngoId,
    user: req.session.user,
    userRole: req.session.userRole,
  });
}

async function registerUser(req, res) {
  try {
    const { event } = req.body;
    console.log(event + "1");
    const userId = req.session.user.userId;
    const ngoId = req.params.ngoID;
    console.log(ngoId);
    const createdEvent = await Event.findOne({
      event_name: event,
      ngoId: ngoId,
    });
    console.log(createdEvent);
        if (!createdEvent) {
      return res.status(404).json({ message: "Event not found." });
    }

    const existingRegistration = await UserRegisteredEvent.findOne({
      userId,
      event_name: event,
      ngoId,
    });
    if (existingRegistration) {
      return res
        .status(400)
        .json({ message: "You have already registered for this event." });
    }

    const userRegisteredEvent = new UserRegisteredEvent({
      userId: userId,
      ngoId: ngoId,
      event_name: event,
      event_date: createdEvent.event_date,
      event_location: createdEvent.event_location,
    });

    await userRegisteredEvent.save();
    console.log("User registration successful: ", userRegisteredEvent);

    const newEventRegistration = await Event.findOneAndUpdate(
      { ngoId, event_name: event },
      { $inc: { number_of_registrations: 1 } },
      { new: true }
    );
    console.log("Registration count updated successfully.");

    res.redirect("/");
  } catch (error) {
    console.error("Error during registration: ", error);
    res.status(500).json({ message: "Internal server error." });
  }
}

async function rendercreatefundraiser(req, res) {
  const ngoID = parseInt(req.params.ngoID, 10);

  try {
    const carehomes = await Carehome.find({});

    res.render("NGOs/create_fundraiser", {
      ngoID,
      care: carehomes,
    });
  } catch (error) {
    console.error("Error in rendercreatefundraiser controller:", error);
    res.status(500).send("Failed to load the Create Fundraiser form");
  }
}

async function render_donate_fundraiser(req, res) {
  console.log("from rendereing of fund doantion form");
  const ngoId = parseInt(req.params.ngoId, 10);
  const name_fund = req.params.fundraiser_name;
  console.log(req.session.user);
  try {
    res.render("NGOs/donate_fundraiser", {
      ngoId,
      name_fund,
      user: req.session.user,
      userRole: req.session.userRole,
    });
  } catch (error) {
    console.log("got error in loading contribution to fundraiser " + error);
    res.status(500).send("error in fund contribution");
  }
}

async function getNGO(req, res) {
  const ngoID = parseInt(req.params.ngoID, 10);

  try {
    console.log("Fetching data for NGO ID:", ngoID);

    const ngo = await NGO.findOne({ ngoId: ngoID });
    console.log(ngo);
    if (!ngo) {
      return res.status(404).send("NGO not found");
    }

    const name = ngo.Ngoname;
    console.log("for profile card : " + name);

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

    const completed_fund = fundraisers.filter((fundraiser) => {
      const deadline =
        fundraiser.deadline instanceof Date
          ? fundraiser.deadline.toISOString().split("T")[0]
          : fundraiser.deadline;
      return deadline < isoCurrentDate;
    });

    const events = await Event.find({ ngoId: ngoID });
    const upcoming_eve = events.filter((event) => {
      const eventDate =
        event.event_date instanceof Date
          ? event.event_date.toISOString().split("T")[0]
          : event.event_date;
      return eventDate >= isoCurrentDate;
    });

    const completed_event = events.filter((event) => {
      const eventDate =
        event.event_date instanceof Date
          ? event.event_date.toISOString().split("T")[0]
          : event.event_date;
      return eventDate < isoCurrentDate;
    });

    const totalFundsRaised = fundraisers.reduce(
      (sum, fundraiser) => sum + (fundraiser.funds_raised || 0),
      0
    );
    const totalRegistrations = events.reduce(
      (sum, event) => sum + (event.number_of_registrations || 0),
      0
    );
    const fundraisersCreated = fundraisers.length;
    const uniqueCareHomes = new Set(
      fundraisers.map((f) => f.id_carehome).filter(Boolean)
    );
    const careHomesBenefited = uniqueCareHomes.size;

    const stats = {
      totalFundsRaised,
      totalRegistrations,
      fundraisersCreated,
      careHomesBenefited,
    };

    res.render("NGOs/ngo_dashboard", {
      name,
      ongoing_fund,
      completed_fund,
      completed_event,
      upcoming_eve,
      ngoID,
      stats,
      user: req.session.user,
      userRole: req.session.userRole,
    });
  } catch (error) {
    console.error("Error in getNGO controller:", error);
    res.status(500).send("An error occurred while loading the dashboard");
  }
}

async function editEvent(req, res) {
  const ngoID = parseInt(req.params.ngoID, 10);
  const {
    original_event_name,
    new_event_name,
    event_location,
    event_date,
    event_time,
    description,
  } = req.body;

  try {
    if (
      !ngoID ||
      !original_event_name ||
      !event_location ||
      !event_date ||
      !event_time
    ) {
      return res.status(400).send("Missing required fields");
    }

    const eventDetails = {
      id_NGO: ngoID,
      original_event_name,
      new_event_name,
      event_location,
      event_date,
      event_time,
      description,
    };

    const result = await Event.edit_event(eventDetails);

    console.log("Event Updated:", result);
    res.redirect(`/NGO-dashboard/${ngoID}`);
  } catch (error) {
    console.error("Error in editEvent controller:", error);
    res.status(500).send("Failed to update event");
  }
}

async function renderEditEvent(req, res) {
  const ngoID = parseInt(req.params.ngoID, 10);
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
      user: req.session.user,
      userRole: req.session.userRole,
    });
  } catch (error) {
    console.error("Error in renderEditEvent controller:", error);
    res.status(500).send("Failed to load the Edit Event form");
  }
}

module.exports = {
  getRegister,
  register,
  getNGO,
  rendercreatefundraiser,
  createFundraiser,
  renderCreateEventForm,
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
};
