const { NGO, Event } = require("../models/NGO.model");
const {
  CreatedFundraiser,
  UserRegisteredEvent,
  User,
} = require("../models/user.model"); // Assuming this is where Fundraiser is defined
const { CareHome } = require("../models/user.model");
/**
 * Render NGO registration page
 */
function getRegister(req, res) {
  res.render("NGOs/ngo_registration");
}

async function get_allngo(req, res) {
  try {
    const NGOs = await NGO.get_all_ngos(); // Await the asynchronous function
    res.render("NGOs/allngos", { ngos: NGOs }); // Pass the data to the EJS view
  } catch (err) {
    console.error("Error while fetching NGOs:", err);
    res.status(500).send("Failed to fetch NGOs"); // Handle errors appropriately
  }
}

/**
 * Register a new NGO
 */
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

    // Create a new NGO instance
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

/**
 * Get NGO profile for editing
 */
async function getEditNGOProfile(req, res) {
  const ngoID = parseInt(req.params.ngoID, 10);

  try {
    const ngo = await NGO.getNGOById(ngoID);

    if (!ngo) {
      return res.status(404).send("NGO not found");
    }

    res.render("NGOs/ngo_edit", { ngoID, ngo });
  } catch (error) {
    console.error("Error getting NGO profile:", error);
    res.status(500).send("Failed to load NGO profile");
  }
}

/**
 * Get all events
 */
async function getEvents(req, res) {
  try {
    const events = await Event.find({ event_date: { $gte: new Date() } });
    res.render("NGOs/events", { upcoming_eve: events });
  } catch (error) {
    console.error("Error fetching upcoming events ", error);
    res.staus(500).send("Failed to load events ");
  }
}

/**
 * Get all fundraisers
 */
async function getFundraisers(req, res) {
  const ngoID = parseInt(req.params.ngoID, 10); // Use ngoID parameter

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

    res.render("NGOs/fundraisers", { ongoing_fund });
  } catch (error) {
    console.error("Error fetching fundraisers:", error);
    res.status(500).send("Failed to load fundraisers");
  }
}

/**
 * Update NGO profile
 */
async function editNGOProfile(req, res) {
  const ngoID = parseInt(req.params.ngoID, 10); // Parse the ngoID parameter

  // Input validation
  if (isNaN(ngoID)) {
    return res.status(400).send("Invalid NGO ID");
  }

  const { fullname, phone, bank, accnum, ifsc, darpan } = req.body;

  try {
    // Use findOneAndUpdate with ngoId field instead of findByIdAndUpdate
    const updatedNGO = await NGO.findOneAndUpdate(
      { ngoId: ngoID }, // Find by ngoId, not _id
      {
        Ngoname: fullname,
        darpan_id: darpan,
        phone,
        account_holder_name: bank,
        account_number: accnum,
        ifsc,
      },
      { new: true } // Return the updated document
    );

    if (!updatedNGO) {
      return res.status(404).send("NGO not found");
    }

    // Handle successful update
    res.redirect(`/NGO-dashboard/${ngoID}`); // Or however you handle successful updates
  } catch (error) {
    console.error("Error updating NGO profile:", error);
    res.status(500).send("Server error");
  }
}
/**
 * Format date to DD-MM-YYYY
 */
function format_date(dateString) {
  const formattedDate = new Date(dateString);
  const day = String(formattedDate.getDate()).padStart(2, "0");
  const month = String(formattedDate.getMonth() + 1).padStart(2, "0");
  const year = formattedDate.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Render create event form
 */
function renderCreateEventForm(req, res) {
  const ngoID = parseInt(req.params.ngoID, 10); // Use ngoID parameter

  try {
    res.render("NGOs/create_event", { ngoID });
  } catch (error) {
    console.error("Error rendering the Create Event form:", error);
    res.status(500).send("Failed to load the Create Event form");
  }
}

/**
 * Create a new event
 */
async function createEvent(req, res) {
  const ngoID = parseInt(req.params.ngoID, 10); // Use ngoID parameter
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
    });

    await newEvent.save();

    console.log("New Event Created:", newEvent);
    res.redirect(`/NGO-dashboard/${ngoID}`);
  } catch (error) {
    console.error("Error in createEvent controller:", error);
    res.status(500).send("Failed to create event");
  }
}

/**
 * Create a new fundraiser
 */
async function createFundraiser(req, res) {
  const ngoID = parseInt(req.params.ngoID, 10); // Use ngoID parameter
  const { fundraiser_name, deadline, goal_amount, description, id_carehome } =
    req.body;

  try {
    if (!ngoID || !fundraiser_name || !deadline || !goal_amount) {
      return res.status(400).send("Missing required fields");
    }

    const newFundraiser = new CreatedFundraiser({
      ngoId: ngoID,
      carehomeId: id_carehome,
      fundraiser_name,
      goal_amount: Number(goal_amount),
      funds_raised: 0,
      description,
      deadline: new Date(deadline),
      has_report: false,
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
  res.render("users/donor_reg", { event, ngoId });
}

async function registerUser(req, res) {
  const { event } = req.body;
  const userId = await User.get;
  const ngoId = req.params.ngoID;
  const createdEvent = await Event.findOne({ event_name: event });
  const userRegisteredEvent = new UserRegisteredEvent({
    userId,
    ngoId,
    event,
    event_date: createdEvent.event_date,
    event_location: createdEvent.event_location,
  });

  await userRegisteredEvent.save();
  res.json({ message: "Registration successful!" });
}

/**
 * Render create fundraiser form
 */
async function rendercreatefundraiser(req, res) {
  const ngoID = parseInt(req.params.ngoID, 10); // Use ngoID parameter

  try {
    const CareHome = require("../models/carehome.model");
    const carehomes = await CareHome.find();

    res.render("NGOs/create_fundraiser", {
      ngoID,
      care: carehomes,
    });
  } catch (error) {
    console.error("Error in rendercreatefundraiser controller:", error);
    res.status(500).send("Failed to load the Create Fundraiser form");
  }
}

/**
 * Get NGO dashboard data
 */
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
    });
  } catch (error) {
    console.error("Error in getNGO controller:", error);
    res.status(500).send("An error occurred while loading the dashboard");
  }
}

async function editEvent(req, res) {
  const ngoID = parseInt(req.params.ngoID, 10); // Retrieve ngoID from route params
  const {
    original_event_name, // Name of the event to identify it
    new_event_name,
    event_location,
    event_date,
    event_time,
    description,
  } = req.body;

  try {
    // Ensure required fields are provided
    if (
      !ngoID ||
      !original_event_name ||
      !event_location ||
      !event_date ||
      !event_time
    ) {
      return res.status(400).send("Missing required fields");
    }

    // Format the event date
    // const formatted_event_date = format_date(event_date);

    // Prepare updated event details
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
  const ngoID = parseInt(req.params.ngoID, 10); // Retrieve ngoID from route params
  try {
    // Get the events for the given NGO ID
    const events = await Event.specific_events(ngoID);
    const eventDetails = {}; // Object to store event data keyed by event_name

    // Loop over the events and fetch their details
    for (const event of events) {
      const details = await Event.event_load(ngoID, event.event_name);
      //   const formattedDetails = {
      //     event_name: data.event_name,
      //     description: data.description,
      //     event_location: data.event_location,
      //     event_time: data.event_time,
      //     deadline: data.event_date, // Assuming event_date is the correct column
      // };

      // Store event details using the event name as the key
      eventDetails[event.event_name] = details;
    }

    // Render the edit events page with the event data
    res.render("NGOs/edit_events", {
      ngoID,
      events, // List of events
      eventDetails: JSON.stringify(eventDetails), // Convert eventDetails to JSON string for client-side use
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
};

// const { resolve } = require("path");
// const NGO = require("../models/NGO.model");
// const { log } = require("console");

// function getRegister(req, res) {
//   res.render("NGOs/ngo_registration");
// }

// function register(req, res) {
//   const {
//     Ngoname,
//     darpan_id,
//     year_established,
//     email,
//     password,
//     phone,
//     address,
//     account_holder_name,
//     account_number,
//     ifsc,
//   } = req.body;

//   const ngo = new NGO(
//     Ngoname,
//     darpan_id,
//     year_established,
//     email,
//     password,
//     phone,
//     address,
//     account_holder_name,
//     account_number,
//     ifsc
//   );

//   ngo.storeNGO();
//   res.redirect("/login");
// }

// async function getEditNGOProfile(req, res) {
//   const ngoID = req.params.ngoID;

//   try {
//     const ngo = await new Promise((resolve) => {
//       NGO.get_ngo_data(ngoID, (err, data) => {
//         if (err) {
//           console.log("error fetching data of user ", err);
//           resolve([]);
//         } else {
//           resolve(data);
//         }
//       });
//     });
//     console.log("fetched details ", ngo);
//     res.render("NGOs/ngo_edit", { ngoID, ngo });
//   } catch (error) {
//     console.error("Error rendering the Create Event form:", error);
//     res.status(500).send("Failed to load the Create Event form");
//   }
// }

// async function getEvents(req, res) {
//   const upcoming_eve = await new Promise((resolve, reject) => {
//     NGO.upcoming_eve((err, data) => {
//       if (err) {
//         console.error("Error fetching upcoming_eve:", err);
//         resolve([]);
//       } else {
//         resolve(data);
//       }
//     });
//   });
//   res.render("NGOs/events", { upcoming_eve });
// }

// async function getFundraisers(req, res) {
//   const ongoing_fund = await new Promise((resolve, reject) => {
//     NGO.ongoing_fund((err, data) => {
//       if (err) {
//         console.error("Error fetching ongoing_fund:", err);
//         resolve([]); // Default to empty array on error
//       } else {
//         resolve(data);
//       }
//     });
//   });

//   res.render("NGOs/fundraisers", { ongoing_fund });
// }

// async function editNGOProfile(req, res) {
//   const NGOId = req.params.ngoID;
//   const { fullname, phone, bank, accnum, ifsc, darpan } = req.body;

//   const update_ngo = {
//     id_NGO: NGOId,
//     fullname,
//     darpan,
//     phone,
//     bank,
//     accnum,
//     ifsc,
//   };

//   const result = await new Promise((resolve, reject) => {
//     NGO.update_profile(update_ngo, (err, data) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(data);
//       }
//     });
//   });

//   res.redirect(`/NGO-dashboard/${NGOId}`);
// }

// function format_date(deadline) {
//   const formattedDate = new Date(deadline);
//   const day = String(formattedDate.getDate()).padStart(2, "0");
//   const month = String(formattedDate.getMonth() + 1).padStart(2, "0");
//   const year = formattedDate.getFullYear();
//   return `${day}-${month}-${year}`;
// }

// function renderCreateEventForm(req, res) {
//   const ngoID = req.params.ngoID;

//   try {
//     res.render("NGOs/create_event", { ngoID });
//   } catch (error) {
//     console.error("Error rendering the Create Event form:", error);
//     res.status(500).send("Failed to load the Create Event form");
//   }
// }

// async function createEvent(req, res) {
//   const { ngoID } = req.params; // Retrieve ngoID from route params
//   const { event_location, event_name, deadline, event_time, description } =
//     req.body;

//   try {
//     // Ensure all required fields are present
//     if (!ngoID || !event_name || !deadline || !event_time) {
//       return res.status(400).send("Missing required fields");
//     }

//     // Convert the date before referencing it
//     const event_date = format_date(deadline); // No need for await as format_date is now synchronous

//     // Prepare event details
//     const eventDetails = {
//       id_NGO: ngoID,
//       event_location,
//       event_name,
//       event_date,
//       event_time,
//       description,
//       number_of_registrations: 0,
//     };

//     // Create the event in the database (simulate with model function)
//     const result = await new Promise((resolve, reject) => {
//       NGO.create_event(eventDetails, (err, data) => {
//         if (err) {
//           reject(err);
//         } else {
//           resolve(data);
//         }
//       });
//     });

//     console.log("New Event Created:", result);
//     res.redirect(`/NGO-dashboard/${ngoID}`);
//   } catch (error) {
//     console.error("Error in createEvent controller:", error);
//     res.status(500).send("Failed to create event");
//   }
// }

// async function createFundraiser(req, res) {
//   const ngoID = req.params.ngoID; // Retrieve ngoID from route params
//   const { fundraiser_name, deadline, goal_amount, description, id_carehome } =
//     req.body;

//   try {
//     if (!ngoID || !fundraiser_name || !deadline || !goal_amount) {
//       return res.status(400).send("Missing required fields");
//     }

//     const fundraiser_deadline = format_date(deadline); // No need for await as format_date is now synchronous

//     // Prepare fundraiser details
//     const fundraiserDetails = {
//       id_NGO: ngoID,
//       id_carehome,
//       fundraiser_name,
//       goal_amount,
//       description,
//       amount_raised_so_far: 0,
//       deadline: fundraiser_deadline,
//       has_report: 0, // Default to false (no report initially)
//     };

//     const result = await new Promise((resolve, reject) => {
//       NGO.create_fundraiser(fundraiserDetails, (err, data) => {
//         if (err) {
//           reject(err);
//         } else {
//           resolve(data);
//         }
//       });
//     });

//     console.log("New Fundraiser Created:", result);
//     res.redirect(`/NGO-dashboard/${ngoID}`);
//   } catch (error) {
//     console.error("Error in createFundraiser controller:", error);
//     res.status(500).send("Failed to create fundraiser");
//   }
// }

// async function rendercreatefundraiser(req, res) {
//   const ngoID = req.params.ngoID;

//   try {
//     const carehomes = await new Promise((resolve, reject) => {
//       NGO.get_carehome((err, data) => {
//         if (err) {
//           console.error("Error fetching care homes:", err);
//           reject(err);
//         } else {
//           resolve(data);
//         }
//       });
//     });

//     console.log("Fetched Care Homes:", carehomes);

//     // Render the EJS template with the fetched data
//     res.render("NGOs/create_fundraiser", {
//       ngoID,
//       care: carehomes, // Pass the care homes to the template
//     });
//   } catch (error) {
//     console.error("Error in rendercreatefundraiser controller:", error);
//     res.status(500).send("Failed to load the Create Fundraiser form");
//   }
// }

// async function editEvent(req, res)
// {
//     const ngoID = req.params.ngoID; // Retrieve ngoID from route params
//     const {
//         original_event_name, // Name of the event to identify it
//         new_event_name,
//         event_location,
//         event_date,
//         event_time,
//         description
//     } = req.body;

//     try {

//         if (!ngoID || !original_event_name || !event_location || !event_date || !event_time) {
//             return res.status(400).send('Missing required fields');
//         }

//         // Format the event date
//         const formatted_event_date = format_date(event_date);

//         // Prepare updated event details
//         const eventDetails = {
//             id_NGO: ngoID,
//             original_event_name,
//             new_event_name,
//             event_location,
//             event_date: formatted_event_date,
//             event_time,
//             description,
//         };

//         const result = await new Promise((resolve, reject) => {
//             NGO.edit_event(eventDetails, (err, data) => {
//                 if (err) {
//                     reject(err);
//                 } else {
//                     resolve(data);
//                 }
//             });
//         });

//         console.log('Event Updated:', result);
//         res.redirect(`/NGO-dashboard/${ngoID}`);

//     } catch (error) {
//         console.error('Error in editEvent controller:', error);
//         res.status(500).send('Failed to update event');
//     }
// }

// async function renderEditEvent(req, res) {
//     const ngoID = req.params.ngoID;
//     try {
//         const events = await new Promise((resolve, reject) => {
//             NGO.specific_events(ngoID, (err, data) => {
//                 if (err) reject(err);
//                 else resolve(data);
//             });
//         });

//         const eventDetails = {}; // Object to store event data keyed by event_name
//         for (const event of events) {
//             const details = await new Promise((resolve, reject) => {
//                 NGO.event_load(ngoID, event.event_name, (err, data) => {
//                     if (err) reject(err);
//                     else {
//                         // Ensure consistent property names
//                         const formattedDetails = {
//                             event_name: data.event_name,
//                             description: data.description,
//                             event_location: data.event_location,
//                             event_time: data.event_time,
//                             deadline: data.event_date // Assuming event_date is the correct column
//                         };
//                         resolve(formattedDetails);
//                     }
//                 });
//             });
//             eventDetails[event.event_name] = details;
//         }

//         res.render('NGOs/edit_events', {
//             ngoID,
//             events,
//             eventDetails: JSON.stringify(eventDetails), // Convert to JSON string for client-side use
//         });
//     } catch (error) {
//         console.error("Error in renderEditEvent controller:", error);
//         res.status(500).send('Failed to load the Edit Event form');
//     }
// }

// async function getNGO(req, res) {
//   const ngoID = req.params.ngoID;
//   try {
//     console.log("Fetching data for NGO ID:", ngoID);

//     // Fetching Ongoing Fundraisers
//     const ongoing_fund = await new Promise((resolve, reject) => {
//       NGO.ongoing_funds(ngoID, (err, data) => {
//         if (err) {
//           console.error("Error fetching ongoing_fund:", err);
//           resolve([]);
//         } else {
//           resolve(data);
//         }
//       });
//     });

//     // Fetching Completed Fundraisers
//     const completed_fund = await new Promise((resolve, reject) => {
//       NGO.completed_fund(ngoID, (err, data) => {
//         if (err) {
//           console.error("Error fetching completed_fund:", err);
//           resolve([]);
//         } else {
//           resolve(data);
//         }
//       });
//     });

//     // Fetching Upcoming Events
//     const upcoming_eve = await new Promise((resolve, reject) => {
//       NGO.upcoming_eves(ngoID, (err, data) => {
//         if (err) {
//           console.error("Error fetching upcoming_eve:", err);
//           resolve([]);
//         } else {
//           resolve(data);
//         }
//       });
//     });

//     // Fetching Completed Events
//     const completed_event = await new Promise((resolve, reject) => {
//       NGO.completed_event(ngoID, (err, data) => {
//         if (err) {
//           console.error("Error fetching completed_event:", err);
//           resolve([]);
//         } else {
//           resolve(data);
//         }
//       });
//     });

//     // Fetching NGO Name
//     const name = await new Promise((resolve, reject) => {
//       NGO.getname(ngoID, (err, data) => {
//         if (err) {
//           console.error("Error fetching name:", err);
//           resolve("Unknown NGO");
//         } else {
//           resolve(data);
//         }
//       });
//     });

//     // Fetching Stats (Total Funds, Registrations, Fundraisers, Care Homes Benefited)
//     const stats = await new Promise((resolve, reject) => {
//       NGO.get_stats(ngoID, (err, data) => {
//         if (err) {
//           console.error("Error fetching stats:", err);
//           reject(err);
//         } else {
//           resolve(data);
//         }
//       });
//     });

//     // console.log("Fetched Data:");
//     // console.log("Ongoing Fundraisers:", ongoing_fund);
//     // console.log("Completed Fundraisers:", completed_fund);
//     // console.log("Upcoming Events:", upcoming_eve);
//     // console.log("Completed Events:", completed_event);
//     // console.log("NGO Name:", name);
//     // console.log("Stats:", stats);

//         // Render the EJS template with all the fetched data
//         res.render('NGOs/ngo_dashboard', {
//             name,
//             ongoing_fund,
//             completed_fund,
//             completed_event,
//             upcoming_eve,
//             ngoID,
//             stats, // Pass stats to the template
//         });
//     } catch (error) {
//         console.error("Error in getNGO controller:", error);
//         res.status(500).send('An error occurred while loading the dashboard');
//     }
// }

// async function get_allngo(req, res) {
//     try {
//         const ngos = await new Promise((resolve) => {
//             NGO.get_all_ngos((err, data) => {
//                 if (err) {
//                     console.log("Error while fetching details of NGOs:", err);
//                     resolve([]);
//                 } else {
//                     resolve(data);
//                 }
//             });
//         });

//         // Fetch stats for each NGO and add them to the object
//         const ngosWithStats = await Promise.all(ngos.map(async (ngo) => {
//             const stats = await new Promise((resolve, reject) => {
//                 NGO.get_stats(ngo.id_NGO, (err, data) => {
//                     if (err) {
//                         console.log(`Error fetching stats for NGO ${ngo.id_NGO}:`, err);
//                         resolve({ totalFundsRaised: 0, totalRegistrations: 0, fundraisersCreated: 0, careHomesBenefited: 0 });
//                     } else {
//                         resolve(data);
//                     }
//                 });
//             });

//             return {
//                 ...ngo,
//                 totalFundsRaised: stats.totalFundsRaised || 0,
//                 totalRegistrations: stats.totalRegistrations || 0,
//                 fundraisersCreated: stats.fundraisersCreated || 0,
//                 careHomesBenefited: stats.careHomesBenefited || 0,
//             };
//         }));

//         res.render('NGOS/allngos', { ngos: ngosWithStats });

//     } catch (error) {
//         console.log("Error in function get_allngo:", error);
//         res.status(500).send("Internal Server Error");
//     }
// }

// // function renderCreateEventForm() { }

// // function createEvent() {}

// // function rendercreatefundraiser() {}

// // function createFundraiser() {}

// module.exports = {
//   getRegister,
//   register,
//   getNGO,
//   rendercreatefundraiser,
//   createFundraiser,
//   renderCreateEventForm,
//   createEvent,
//   getEditNGOProfile,
//   editNGOProfile,
//   get_allngo,
//   editEvent,
//   renderEditEvent,
//   getEvents,
//   getFundraisers
// };
