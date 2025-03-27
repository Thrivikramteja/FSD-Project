const NGO = require("../models/NGO.model");

function getRegister(req, res) {
  res.render("NGOs/ngo_registration");
}

function register(req, res) {
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

  const ngo = new NGO(
    Ngoname,
    darpan_id,
    year_established,
    email,
    password,
    phone,
    address,
    account_holder_name,
    account_number,
    ifsc
  );

  ngo.storeNGO();
  res.redirect("/login");
}

async function getEditNGOProfile(req, res) {
  const ngoID = req.params.ngoID;

  try {
    const ngo = await new Promise((resolve) => {
      NGO.get_ngo_data(ngoID, (err, data) => {
        if (err) {
          console.log("error fetching data of user ", err);
          resolve([]);
        } else {
          resolve(data);
        }
      });
    });
    console.log("fetched details ", ngo);
    res.render("NGOs/ngo_edit", { ngoID, ngo });
  } catch (error) {
    console.error("Error rendering the Create Event form:", error);
    res.status(500).send("Failed to load the Create Event form");
  }
}

async function getEvents(req, res) {
  const upcoming_eve = await new Promise((resolve, reject) => {
    NGO.upcoming_eve((err, data) => {
      if (err) {
        console.error("Error fetching upcoming_eve:", err);
        resolve([]);
      } else {
        resolve(data);
      }
    });
  });
  res.render("NGOs/events", { upcoming_eve });
}

async function getFundraisers(req, res) {
  const ongoing_fund = await new Promise((resolve, reject) => {
    NGO.ongoing_fund((err, data) => {
      if (err) {
        console.error("Error fetching ongoing_fund:", err);
        resolve([]); // Default to empty array on error
      } else {
        resolve(data);
      }
    });
  });

  res.render("NGOs/fundraisers", { ongoing_fund });
}

async function editNGOProfile(req, res) {
  const NGOId = req.params.ngoID;
  const { fullname, phone, bank, accnum, ifsc, darpan } = req.body;

  const update_ngo = {
    id_NGO: NGOId,
    fullname,
    darpan,
    phone,
    bank,
    accnum,
    ifsc,
  };

  const result = await new Promise((resolve, reject) => {
    NGO.update_profile(update_ngo, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });

  res.redirect(`/NGO-dashboard/${NGOId}`);
}

function format_date(deadline) {
  const formattedDate = new Date(deadline);
  const day = String(formattedDate.getDate()).padStart(2, "0");
  const month = String(formattedDate.getMonth() + 1).padStart(2, "0");
  const year = formattedDate.getFullYear();
  return `${day}-${month}-${year}`;
}

function renderCreateEventForm(req, res) {
  const ngoID = req.params.ngoID;

  try {
    res.render("NGOs/create_event", { ngoID });
  } catch (error) {
    console.error("Error rendering the Create Event form:", error);
    res.status(500).send("Failed to load the Create Event form");
  }
}

async function createEvent(req, res) {
  const { ngoID } = req.params; // Retrieve ngoID from route params
  const { event_location, event_name, deadline, event_time, description } =
    req.body;

  try {
    // Ensure all required fields are present
    if (!ngoID || !event_name || !deadline || !event_time) {
      return res.status(400).send("Missing required fields");
    }

    // Convert the date before referencing it
    const event_date = format_date(deadline); // No need for await as format_date is now synchronous

    // Prepare event details
    const eventDetails = {
      id_NGO: ngoID,
      event_location,
      event_name,
      event_date,
      event_time,
      description,
      number_of_registrations: 0,
    };

    // Create the event in the database (simulate with model function)
    const result = await new Promise((resolve, reject) => {
      NGO.create_event(eventDetails, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });

    console.log("New Event Created:", result);
    res.redirect(`/NGO-dashboard/${ngoID}`);
  } catch (error) {
    console.error("Error in createEvent controller:", error);
    res.status(500).send("Failed to create event");
  }
}

async function createFundraiser(req, res) {
  const ngoID = req.params.ngoID; // Retrieve ngoID from route params
  const { fundraiser_name, deadline, goal_amount, description, id_carehome } =
    req.body;

  try {
    if (!ngoID || !fundraiser_name || !deadline || !goal_amount) {
      return res.status(400).send("Missing required fields");
    }

    const fundraiser_deadline = format_date(deadline); // No need for await as format_date is now synchronous

    // Prepare fundraiser details
    const fundraiserDetails = {
      id_NGO: ngoID,
      id_carehome,
      fundraiser_name,
      goal_amount,
      description,
      amount_raised_so_far: 0,
      deadline: fundraiser_deadline,
      has_report: 0, // Default to false (no report initially)
    };

    const result = await new Promise((resolve, reject) => {
      NGO.create_fundraiser(fundraiserDetails, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });

    console.log("New Fundraiser Created:", result);
    res.redirect(`/NGO-dashboard/${ngoID}`);
  } catch (error) {
    console.error("Error in createFundraiser controller:", error);
    res.status(500).send("Failed to create fundraiser");
  }
}

async function rendercreatefundraiser(req, res) {
  const ngoID = req.params.ngoID;

  try {
    const carehomes = await new Promise((resolve, reject) => {
      NGO.get_carehome((err, data) => {
        if (err) {
          console.error("Error fetching care homes:", err);
          reject(err);
        } else {
          resolve(data);
        }
      });
    });

    console.log("Fetched Care Homes:", carehomes);

    // Render the EJS template with the fetched data
    res.render("NGOs/create_fundraiser", {
      ngoID,
      care: carehomes, // Pass the care homes to the template
    });
  } catch (error) {
    console.error("Error in rendercreatefundraiser controller:", error);
    res.status(500).send("Failed to load the Create Fundraiser form");
  }
}

async function getNGO(req, res) {
  const ngoID = req.params.ngoID;
  try {
    console.log("Fetching data for NGO ID:", ngoID);

    // Fetching Ongoing Fundraisers
    const ongoing_fund = await new Promise((resolve, reject) => {
      NGO.ongoing_funds(ngoID, (err, data) => {
        if (err) {
          console.error("Error fetching ongoing_fund:", err);
          resolve([]);
        } else {
          resolve(data);
        }
      });
    });

    // Fetching Completed Fundraisers
    const completed_fund = await new Promise((resolve, reject) => {
      NGO.completed_fund(ngoID, (err, data) => {
        if (err) {
          console.error("Error fetching completed_fund:", err);
          resolve([]);
        } else {
          resolve(data);
        }
      });
    });

    // Fetching Upcoming Events
    const upcoming_eve = await new Promise((resolve, reject) => {
      NGO.upcoming_eves(ngoID, (err, data) => {
        if (err) {
          console.error("Error fetching upcoming_eve:", err);
          resolve([]);
        } else {
          resolve(data);
        }
      });
    });

    // Fetching Completed Events
    const completed_event = await new Promise((resolve, reject) => {
      NGO.completed_event(ngoID, (err, data) => {
        if (err) {
          console.error("Error fetching completed_event:", err);
          resolve([]);
        } else {
          resolve(data);
        }
      });
    });

    // Fetching NGO Name
    const name = await new Promise((resolve, reject) => {
      NGO.getname(ngoID, (err, data) => {
        if (err) {
          console.error("Error fetching name:", err);
          resolve("Unknown NGO");
        } else {
          resolve(data);
        }
      });
    });

    // Fetching Stats (Total Funds, Registrations, Fundraisers, Care Homes Benefited)
    const stats = await new Promise((resolve, reject) => {
      NGO.get_stats(ngoID, (err, data) => {
        if (err) {
          console.error("Error fetching stats:", err);
          reject(err);
        } else {
          resolve(data);
        }
      });
    });

    // console.log("Fetched Data:");
    // console.log("Ongoing Fundraisers:", ongoing_fund);
    // console.log("Completed Fundraisers:", completed_fund);
    // console.log("Upcoming Events:", upcoming_eve);
    // console.log("Completed Events:", completed_event);
    // console.log("NGO Name:", name);
    // console.log("Stats:", stats);

    // Render the EJS template with all the fetched data
    res.render("NGOs/ngo_dashboard", {
      name,
      ongoing_fund,
      completed_fund,
      completed_event,
      upcoming_eve,
      ngoID,
      stats, // Pass stats to the template
    });
  } catch (error) {
    console.error("Error in getNGO controller:", error);
    res.status(500).send("An error occurred while loading the dashboard");
  }
}

// function renderCreateEventForm() { }

// function createEvent() {}

// function rendercreatefundraiser() {}

// function createFundraiser() {}

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
  getEvents,
  getFundraisers,
};
