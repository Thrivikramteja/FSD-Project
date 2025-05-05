const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose); // Added mongoose-sequence

const { CreatedFundraiser } = require("./user.model");

// Calculate current date in ISO format for comparisons
const today = new Date();
const isoCurrentDate = `${today.getFullYear()}-${String(
  today.getMonth() + 1
).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

// NGO Schema
const ngoSchema = new mongoose.Schema({
  Ngoname: String,
  darpan_id: String, // Removed auto-increment from here as you don't need it.
  year_established: Number,
  email: { type: String, required: true, unique: true },
  password: String,
  phone: String,
  address: String,
  account_holder_name: String,
  account_number: String,
  ifsc: String,
  ngoId: { type: Number, unique: true }, // This will be auto-incremented
});

// Add auto-increment plugin only for ngoId
ngoSchema.plugin(AutoIncrement, { inc_field: "ngoId" });

// Event Schema
const eventSchema = new mongoose.Schema({
  ngoId: {
    type: Number,
  },
  event_location: {
    type: String,
    required: true,
  },
  event_name: {
    type: String,
    required: true,
  },
  event_date: {
    type: Date,
    required: true,
  },
  event_time: {
    type: String,
    required: true,
  },
  number_of_registrations: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    required: true,
  },
});

// NGO Schema Methods
ngoSchema.methods.storeNGO = async function storeNGO() {
  try {
    this.password = await bcrypt.hash(this.password, 12);
    return await this.save();
  } catch (err) {
    throw err;
  }
};



ngoSchema.statics.getNGOById = async function (id) {
  try {
    const ngo = await this.find({ngoId: id});
    return ngo;
  } catch (err) {
    throw new Error("NGO not found or invalid ID");
  }
};

ngoSchema.statics.ongoing_fund = async function () {
  const currentDate = new Date();
  const fundraisers = await CreatedFundraiser.find({
    deadline: { $gt: currentDate },
  });
  return fundraisers;
};

ngoSchema.statics.getNGO = async function (email) {
  try {
    const ngo = await this.findOne({ email });
    return ngo;
  } catch (err) {
    throw new Error("NGO not found or invalid email");
  }
};

// Get NGO ID by email
ngoSchema.statics.getId = async function (email) {
  try {
    const ngo = await this.findOne({ email: email });
    return ngo ? ngo._id : null;
  } catch (err) {
    throw new Error("NGO not found or invalid email");
  }
};

ngoSchema.statics.ongoing_funds = async function (ngoId, callback) {
  try {
    const fundraisers = await Fundraiser.find({ ngoId: ngoId });

    const ongoing_fund = fundraisers.filter((fundraiser) => {
      const isoDate = toISO(fundraiser.deadline);
      return isoDate && isoDate >= isoCurrentDate;
    });

    callback(null, ongoing_fund);
  } catch (err) {
    console.error("Error while getting ongoing fundraisers", err);
    callback(err, null);
  }
};

ngoSchema.statics.completed_fund = async function (ngoId, callback) {
  try {
    const fundraisers = await Fundraiser.find({ ngoId: ngoId });

    const completed_fund = fundraisers.filter((fundraiser) => {
      const isoDate = toISO(fundraiser.deadline);
      return isoDate && isoDate < isoCurrentDate;
    });

    callback(null, completed_fund);
  } catch (err) {
    console.error("Error fetching completed fundraisers:", err);
    callback(err, null);
  }
};

// Get ongoing events
ngoSchema.statics.ongoing_events = async function (ngoId, callback) {
  try {
    const events = await Event.find({ ngoId: ngoId });

    const ongoing_events = events.filter((event) => {
      const eventDate =
        event.event_date instanceof Date
          ? event.event_date.toISOString().split("T")[0]
          : toISO(event.event_date);

      return eventDate && eventDate >= isoCurrentDate;
    });

    callback(null, ongoing_events);
  } catch (err) {
    console.error("Error fetching ongoing events:", err);
    callback(err, null);
  }
};

// Get completed events
ngoSchema.statics.completed_event = async function (ngoId, callback) {
  try {
    const events = await Event.find({ ngoId: ngoId });

    const completed_event = events.filter((event) => {
      const eventDate =
        event.event_date instanceof Date
          ? event.event_date.toISOString().split("T")[0]
          : toISO(event.event_date);

      return eventDate && eventDate < isoCurrentDate;
    });

    callback(null, completed_event);
  } catch (err) {
    console.error("Error fetching completed events:", err);
    callback(err, null);
  }
};

// Create new event
ngoSchema.statics.create_event = async function (eventDetails, callback) {
  try {
    const event = new Event(eventDetails);
    await event.save();
    callback(null, event);
  } catch (err) {
    console.error("Error while creating new event:", err);
    callback(err, null);
  }
};

// Create new fundraiser
ngoSchema.statics.create_fundraiser = async function (
  fundraiserDetails,
  callback
) {
  try {
    const fundraiser = new Fundraiser(fundraiserDetails);
    await fundraiser.save();
    callback(null, fundraiser);
  } catch (err) {
    console.error("Error while creating new fundraiser:", err);
    callback(err, null);
  }
};

// Get statistics for a specific NGO
ngoSchema.statics.get_stats = async function (ngoId, callback) {
  try {
    const stats = {
      totalFundsRaised: 0,
      totalRegistrations: 0,
      fundraisersCreated: 0,
      careHomesBenefited: 0,
    };

    const fundsRaised = await Fundraiser.aggregate([
      { $match: { ngoId: ngoId } },
      { $group: { _id: null, total: { $sum: "$funds_raised" } } },
    ]);

    stats.totalFundsRaised = fundsRaised[0] ? fundsRaised[0].total : 0;

    const registrations = await Event.aggregate([
      { $match: { ngoId: ngoId } },
      { $group: { _id: null, total: { $sum: "$number_of_registrations" } } },
    ]);

    stats.totalRegistrations = registrations[0] ? registrations[0].total : 0;

    const fundraisersAndCareHomes = await Fundraiser.aggregate([
      { $match: { ngoId: ngoId } },
      {
        $group: {
          _id: null,
          fundraisersCreated: { $sum: 1 },
          careHomesBenefited: { $addToSet: "$id_carehome" },
        },
      },
    ]);

    stats.fundraisersCreated = fundraisersAndCareHomes[0]
      ? fundraisersAndCareHomes[0].fundraisersCreated
      : 0;
    stats.careHomesBenefited = fundraisersAndCareHomes[0]
      ? fundraisersAndCareHomes[0].careHomesBenefited.length
      : 0;

    callback(null, stats);
  } catch (err) {
    console.error("Error fetching stats:", err);
    callback(err, null);
  }
};

ngoSchema.statics.get_all_ngos = async function () {
  try {
    const ngos = await this.find({});
    return ngos; // Return the fetched NGOs
  } catch (err) {
    console.error("Error while fetching NGOs", err);
    throw err; // Throw the error to let the caller handle it
  }
};

// Inside eventSchema.statics
// ngoSchema.statics.upcoming_eve = async function () {
//   try {
//     const currentDate = new Date();
//     currentDate.setHours(0, 0, 0, 0); // Set to today's midnight

//     // Find events with event_date today or in the future
//     const upcomingEvents = await this.find({
//       event_date: { $gte: currentDate }
//     });
// console.log(upcomingEvents);
//     return upcomingEvents;
//   } catch (err) {
//     console.error("Error fetching upcoming events:", err);
//     throw err; // rethrow to be caught where the function is called
//   }
// };

// This should be on the eventSchema, not ngoSchema
eventSchema.statics.upcoming_eve = async function () {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set to today's midnight
    // Find events with event_date today or in the future
    const upcomingEvents = await this.find({
      event_date: { $gte: currentDate }
    });
    console.log(upcomingEvents);
    return upcomingEvents;
  } catch (err) {
    console.error("Error fetching upcoming events:", err);
    throw err;
  }
};

eventSchema.statics.specific_events = async function(ngoID) {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set to today's midnight
    
    // Find events for the specific NGO with event_date today or in the future
    const events = await this.find({
      ngoId: ngoID,
      event_date: { $gte: currentDate }
    });
    
    return events;
  } catch (err) {
    console.error('Error fetching specific events:', err);
    throw err; // rethrow to be caught where the function is called
  }
};
eventSchema.statics.event_load = async function(ngoID, event_name) {
  try {
    // Find a single event that matches both the ngoId and event_name
    const event = await this.findOne({
      ngoId: ngoID,
      event_name: event_name
    });
    
    return event; // Will be null if no matching event is found
  } catch (err) {
    console.error("Error fetching event details:", err);
    throw err; // rethrow to be caught where the function is called
  }
};


eventSchema.statics.edit_event = async function(eventDetails) {
  try {
    const {
      id_NGO,
      original_event_name, // Original event name to identify the event
      new_event_name,      // New event name (title)
      event_location,
      event_date,
      event_time,
      description,
    } = eventDetails;

    // Create update object with only the fields that are provided
    const updateData = {};
    if (new_event_name) updateData.event_name = new_event_name;
    if (event_location) updateData.event_location = event_location;
    if (event_date) updateData.event_date = new Date(event_date);
    if (event_time) updateData.event_time = event_time;
    if (description) updateData.description = description;

    // Find and update the event
    const result = await this.findOneAndUpdate(
      { 
        ngoId: id_NGO, 
        event_name: original_event_name 
      },
      { $set: updateData },
      { new: true } // Return the updated document
    );

    if (!result) {
      throw new Error('No event found to update.');
    }

    return { 
      success: true, 
      ...eventDetails,
      updatedEvent: result 
    };
  } catch (err) {
    console.error('Error while updating event:', err);
    throw err; // rethrow to be caught where the function is called
  }
};

const NGO = mongoose.model("NGO", ngoSchema);
const Event = mongoose.model("Event", eventSchema);

module.exports = { NGO, Event };
