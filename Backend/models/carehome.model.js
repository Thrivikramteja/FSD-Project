const mongoose = require("mongoose");
const { CreatedFundraiser, User } = require("./user.model");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const { donate_items_mes } = require('./user.model');

const carehomeSchema = new mongoose.Schema({
  carehomeId: { type: Number, unique: true },
  care_home_name: String,
  reg_number: String,
  email: String,
  password: String,
  contact: String,
  state: String,
  city: String,
  num_residents: Number,
  avg_expense: Number,
  wishlist: String,
  description: String,
  account_holder: String,
  account_number: String,
  ifsc: String,
  terms: String,
  imagePath: {
    type: String,
    required: false,
  },
  otpCode: { type: String, default: null },
  otpExpires: { type: Date, default: null },
});

carehomeSchema.plugin(AutoIncrement, { inc_field: "carehomeId" });
carehomeSchema.index(
  { care_home_name: "text", city: "text", state: "text" },
  { weights: { care_home_name: 10, city: 5, state: 5 } }
); // Index


carehomeSchema.statics.getCareHomes = async function () {
  const carehomes = await Carehome.find({});
  return carehomes;
};

carehomeSchema.statics.getCarehome = async function (email) {
  const carehome = await Carehome.findOne({ email });
  return carehome;
};
carehomeSchema.statics.getallcarehomes = async function () {
  const carehomes = await Carehome.find({});
  return carehomes;
}

carehomeSchema.statics.getname = async function (careId) {
  const carehome = await Carehome.findOne({ carehomeId: careId });
  return carehome;
};

carehomeSchema.statics.ongoing_fund = async function (careId) {
  const currentDate = new Date();
  const fundraisers = await CreatedFundraiser.find({
    carehomeId: careId,
    deadline: { $gte: currentDate },
  });
  return fundraisers;
};

carehomeSchema.statics.completed_fund = async function (careId) {
  const currentDate = new Date();
  const fundraisers = await CreatedFundraiser.find({
    carehomeId: careId,
    deadline: { $lt: currentDate },
  });
  return fundraisers;
};

carehomeSchema.statics.getallcarehoms = async function () {
  const carehomes = await Carehome.find({});
  return carehomes;
};

carehomeSchema.statics.get_care_data = async function (careId) {
  const carehome = await Carehome.findOne({ carehomeId: careId });
  return carehome;
};

carehomeSchema.statics.getWishlist = async function (careId) {
  const carehome = await Carehome.findOne({ carehomeId: careId });
  return carehome.wishlist;
};

carehomeSchema.statics.getCarehomeId = async function (email) {
  const carehome = await Carehome.findOne({ email });
  return carehome.carehomeId;
};

const donationMoneySchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
  },
  amount_donated: {
    type: Number,
    required: true,
  },
  carehomeId: {
    type: Number,
    required: true,
  },
  donated_at: {
    type: Date,
    default: Date.now,
  },
});

const donationitemschema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true
  },
  carehomeId: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  delivery: {
    type: Date,
    required: true
  },
  description: {
    type: String,
  },
  location: {
    type: String,
    required: true,
  },
  donated_at: {
    type: Date,
    required: true
  }
});

donationitemschema.statics.get_item_donations = async function (carehomeId) {
  const donations = await this.find({ carehomeId: carehomeId })
    .sort({ donated_at: -1 }) // Sort by `donated_at` in descending order (newest first)
    .limit(4); // Limit to the first 4 results
  console.log("I am from model (sorted and limited): ", donations);
  return donations;
};


donationMoneySchema.statics.saveDonation = async function ({ userId, amount_donated, carehomeId }) {
  const donation = new this({
    userId,
    amount_donated,
    carehomeId,
    donated_at: new Date()
  });

  await donation.save();
};

carehomeSchema.statics.get_carehome_stats_optimized = async function (carehomeId) {
  const [moneyStats, careDetails] = await Promise.all([
    mongoose.model("DonationMoney").aggregate([
      { $match: { carehomeId: carehomeId } },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount_donated" },
          highest: { $max: "$amount_donated" }
        }
      }
    ]),
    this.findOne({ carehomeId }, { avg_expense: 1, num_residents: 1 }).lean()
  ]);

  const mStats = moneyStats[0] || { total: 0, highest: 0 };
  const avgCost = careDetails?.num_residents 
    ? (careDetails.avg_expense / careDetails.num_residents).toFixed(2) 
    : 0;

  return [
    { title: "Total Funds Received", value: mStats.total },
    { title: "Average Monthly Expense", value: careDetails?.avg_expense || 0 },
    { title: "Number of Residents", value: careDetails?.num_residents || 0 },
    { title: "Average Cost Per Resident", value: avgCost },
    { title: "Highest Donation", value: mStats.highest }
  ];
};

carehomeSchema.statics.getRecentDonationsOptimized = async function (careId) {
  return await mongoose.model("DonationMoney").aggregate([
    { $match: { carehomeId: careId } },
    { $sort: { donated_at: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "donors", 
        localField: "userId",
        foreignField: "userId",
        as: "donorInfo"
      }
    },
    {
      $addFields: {
        // Extracts the first element from the joined array
        donor: { $arrayElemAt: ["$donorInfo", 0] }
      }
    },
    {
      $project: {
        _id: 1,
        amount: "$amount_donated",
        donated_at: 1,
        // Fallback to "Anonymous" if no user is found
        donor_name: { $ifNull: ["$donor.name", "Anonymous"] } 
      }
    }
  ]);
};
carehomeSchema.statics.getMessages = async function (carehomeId) {
  try {
    const messages = await donate_items_mes.find({ carehomeId: carehomeId });
    return messages;
  }
  catch (error) {
    console.log("error while getting messages: " + error);
    throw error;
  }
};

//new feature : jobs
//schema for care home posted job
const careHomeJobSchema = new mongoose.Schema({
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Carehome', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: String,
  pay: Number,
  type: { type: String, enum: ['Caretaker', 'Part-time', 'Full-time', 'Other'], default: 'Other' },
  startDate: Date,
  endDate: Date,
  createdAt: { type: Date, default: Date.now }
});

//indices
careHomeJobSchema.index(
  { title: "text", location: "text", description: "text" },
  { weights: { title: 10, location: 5, description: 2 } }
);


//new feature : application for jobs
//when a user applies for job it get stores in this schema
// const applicationSchema = new mongoose.Schema({
//   // Reference to the specific Job posted
//   jobId: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: 'CareHomeJob', 
//     required: true 
//   },
  
  // Reference to the User (Document reference)
  // Even if your friend is using a custom 'id', MongoDB's _id is the anchor.
//   userId: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: 'User', 
//     required: true 
//   },

//   // Reference to the CareHome Document
//   carehomeId: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: 'Carehome',
//     required: true
//   },

//   status: { 
//     type: String, 
//     enum: ['Pending', 'Accepted', 'Rejected'], 
//     default: 'Pending' 
//   },

//   appliedAt: { 
//     type: Date, 
//     default: Date.now 
//   }
// });

// const JobApplication = mongoose.model("JobApplication", applicationSchema);
const Carehome = mongoose.model("Carehome", carehomeSchema);
const DonationMoney = mongoose.model("DonationMoney", donationMoneySchema);
const donate_items = mongoose.model("donate_items", donationitemschema);
const CareHomeJob = mongoose.model("CareHomeJob", careHomeJobSchema);

module.exports = { Carehome, DonationMoney, donate_items, CareHomeJob };