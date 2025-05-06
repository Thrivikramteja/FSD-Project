// const db = require("../data/sqlite3");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

// const today = new Date();
// const isoCurrentDate = `${today.getFullYear()}-${String(
//   today.getMonth() + 1
// ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

const donorSchema = new mongoose.Schema({
  userId: { type: Number, unique: true },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  mobile_number: {
    type: String,
    required: true,
  },
  receive_notifications: {
    type: Boolean,
    default: false,
  },
});

donorSchema.plugin(AutoIncrement, { inc_field: "userId" });

donorSchema.statics.getUserByEmail = async function (email) {
  const user = await this.findOne({ email });
  return user;
};

donorSchema.statics.getUserByUserId = function (userId) {
  return this.findOne({ userId });
};

donorSchema.methods.signup = async function () {
  const hashedPassword = await bcrypt.hash(this.password, 12);
  this.password = hashedPassword;

  await this.save();
};

donorSchema.statics.getname = async function (userId) {
  const user = await this.findOne({ userId });
  console.log(user.name);
  return user.name;
};

const userRegisteredEventsSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
  },
  ngoId: {
    type: Number,
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
  event_location: {
    type: String,
    required: true,
  },
});

donorSchema.statics.participatedEvents = async function (userId) {
  const currentDate = new Date();
  const events = await UserRegisteredEvent.find({
    userId: userId,
    event_date: { $lt: currentDate },
  });
  return events;
};

donorSchema.statics.upcomingEvents = async function (userId) {
  const currentDate = new Date();

  const upcoming = await UserRegisteredEvent.find({
    event_date: { $gt: currentDate },
  });
};

const userContributedFundraisersSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
  },
  ngoId: {
    type: Number,
    required: true,
  },
  fundraiser_name: {
    type: String,
    required: true,
  },
  amount_contributed: {
    type: Number,
    required: true,
  },
  contributed_at: {
    type: Date,
    default: Date.now,
  },
  deadline: {
    type: Date,
    required: true,
  },
});

donorSchema.statics.contributedFundraisers = async function (userId) {
  const fundraisers = await UserContributedFundraiser.find({
    userId: userId,
  });
  return fundraisers;
};

const createdFundraisersSchema = new mongoose.Schema({
  carehomeId: {
    type: Number,
    required: true,
  },
  fundraiser_name: {
    type: String,
    required: true,
  },
  ngoId: {
    type: Number,
    required: true,
  },
  has_report: {
    type: Buffer,
    required: false,
  },
  goal_amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  amount_raised_so_far: {
    type: Number,
    default: 0,
  },
  deadline: {
    type: Date,
    required: true,
  },
});

donorSchema.statics.ongoingfund = async function () {
  const currentDate = new Date();
  const fundraisers = await CreatedFundraiser.find({
    deadline: { $gt: currentDate },
  });
  return fundraisers;
};

const User = mongoose.model("Donor", donorSchema);
const CreatedFundraiser = mongoose.model(
  "CreatedFundraiser",
  createdFundraisersSchema
);
const UserRegisteredEvent = mongoose.model(
  "UserRegisteredEvent",
  userRegisteredEventsSchema
);
const UserContributedFundraiser = mongoose.model(
  "UserContributedFundraiser",
  userContributedFundraisersSchema
);

module.exports = {
  User,
  CreatedFundraiser,
  UserContributedFundraiser,
  UserRegisteredEvent,
};

// class User {
//   constructor(name, email, password, contact, checkbox) {
//     (this.email = email), (this.password = password), (this.name = name);
//     this.contact = contact;
//     this.checkbox = checkbox;
//   }

//   static getUser(email, callback) {
//     const sql = "SELECT * FROM donors WHERE email = ?"; // Adjust table name if needed

//     db.get(sql, [email], (err, row) => {
//       if (err) return callback(err, null);
//       return callback(null, row); // Returns a single User or null if not found
//     });
//   }

//   static get_user_data(userId, callback) {
//     const query = `select * from donors where id_donor = ?`;
//     db.get(query, [userId], (err, rows) => {
//       if (err) {
//         console.error("Error fetching user data:", err);
//         callback(err, null);
//       } else {
//         callback(null, rows);
//       }
//     });
//   }

//   async signup() {
//     const hashedPassword = await bcrypt.hash(this.password, 12);

//     const sqlQuery =
//       "INSERT INTO donors (name, email, password, mobile_number, receive_notifications) VALUES (?, ?, ?, ?, ?)";
//     console.log(this.email);
//     console.log(this.contact);
//     console.log(this.name);
//     console.log(this.checkbox);
//     db.run(
//       sqlQuery,
//       [
//         this.name,
//         this.email,
//         hashedPassword,
//         this.contact,
//         this.checkbox ? this.checkbox : "off",
//       ],
//       (err) => {
//         if (err) {
//           console.error("error in signup: ", err);
//         } else {
//           console.log("signup done.");
//         }
//       }
//     );

//     db.get("SELECT * FROM donors WHERE email = ?", [this.email], (err, row) => {
//       if (err) {
//         console.error(err);
//       }
//       if (row) {
//         console.log(row);
//       }
//     });
//   }

//   hasMatchingPassword(hashedPassword) {
//     return bcrypt.compare(this.password, hashedPassword);
//   }

//   static toISO(dateText) {
//     if (!dateText) {
//       console.warn("Invalid or missing date:", dateText);
//       return null;
//     }

//     try {
//       const [day, month, year] = dateText.split("-");
//       if (!day || !month || !year) {
//         console.warn("Invalid date format:", dateText);
//         return null;
//       }
//       return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
//         2,
//         "0"
//       )}`;
//     } catch (error) {
//       console.error("Error parsing date:", dateText, error);
//       return null;
//     }
//   }

//   static getname(userId, callback) {
//     db.get(
//       "SELECT name FROM donors WHERE id_donor = ?",
//       [userId],
//       (err, row) => {
//         if (err) {
//           console.error("Error while getting name of the donor:", err);
//           callback(err, null);
//         } else {
//           callback(null, row ? row.name : null);
//         }
//       }
//     );
//   }

//   static participatedEvents(userId, callback) {
//     const query = "SELECT * FROM user_registered_events WHERE id_donor = ?";
//     db.all(query, [userId], (err, rows) => {
//       if (err) {
//         console.error("Error while getting participated events:", err);
//         callback(err, null);
//       } else {
//         const participatedEvents = rows.filter((row) => {
//           const isoDate = User.toISO(row.event_date);
//           return isoDate && isoDate < isoCurrentDate;
//         });

//         callback(null, participatedEvents);
//       }
//     });
//   }

//   static contributedFundraisers(userId, callback) {
//     const query =
//       "SELECT * FROM user_contributed_fundraisers WHERE id_donor = ?";
//     db.all(query, [userId], (err, rows) => {
//       if (err) {
//         console.error("Error fetching contributed fundraisers:", err);
//         callback(err, null);
//       } else {
//         const contributedFundraisers = rows.filter((row) => {
//           const isoDate = User.toISO(row.deadline);
//           return isoDate && isoDate < isoCurrentDate;
//         });
//         callback(null, contributedFundraisers);
//       }
//     });
//   }

//   static ongoingfund(userId, callback) {
//     const query =
//       "SELECT * FROM user_contributed_fundraisers WHERE id_donor = ?";
//     db.all(query, [userId], (err, rows) => {
//       if (err) {
//         console.error("Error fetching contributed fundraisers:", err);
//         callback(err, null);
//       } else {
//         const ongoingFund = rows.filter((row) => {
//           const isoDate = User.toISO(row.deadline);
//           return isoDate && isoDate >= isoCurrentDate;
//         });
//         callback(null, ongoingFund);
//       }
//     });
//   }

//   static upcomingEvents(userId, callback) {
//     const query = "SELECT * FROM user_registered_events WHERE id_donor = ?";
//     db.all(query, [userId], (err, rows) => {
//       if (err) {
//         console.error("Error fetching upcoming events:", err);
//         callback(err, null);
//       } else {
//         const upcomingEvents = rows.filter((row) => {
//           const isoDate = User.toISO(row.event_date);
//           return isoDate && isoDate >= isoCurrentDate;
//         });
//         callback(null, upcomingEvents);
//       }
//     });
//   }
// }
