// const db = require("../data/sqlite3");
// const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { CreatedFundraiser, User } = require("./user.model");
const AutoIncrement = require("mongoose-sequence")(mongoose);

// const today = new Date();
// const isoCurrentDate = `${today.getFullYear()}-${String(
//   today.getMonth() + 1
// ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

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
});

carehomeSchema.plugin(AutoIncrement, { inc_field: "carehomeId" });

carehomeSchema.statics.getCareHomes = async function () {
  const carehomes = await Carehome.find(
    {},
    { carehomeId: 1, care_home_name: 1 }
  );
  return carehomes;
};

carehomeSchema.statics.getCarehome = async function (email) {
  const carehome = await Carehome.findOne({ email });
  return carehome;
};
carehomeSchema.statics.getallcarehomes =async function ()
{
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
    deadline: { $gt: currentDate },
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

carehomeSchema.statics.get_care_data = async function (careId) 
{
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

carehomeSchema.statics.getCities = async function () {
  const cities = await Carehome.distinct("city");
  return cities;
};

carehomeSchema.statics.getStates = async function () {
  const states = await Carehome.distinct("state");
  return states;
};

const donationMoneySchema = new mongoose.Schema({
  id_donor: {
    type: Number,
    required: true,
  },
  amount_donated: {
    type: Number,
    required: true,
  },
  id_carehome: {
    type: Number,
    required: true,
  },
  donated_at: {
    type: Date,
    default: Date.now,
  },
});

carehomeSchema.statics.get_carehome_stats = async function (carehomeId) {
  const stats = [];

  // 1. Total Funds Received
  const totalFundsResult = await DonationMoney.aggregate([
    { $match: { id_carehome: carehomeId } },
    {
      $group: {
        _id: null,
        totalFundsReceived: { $sum: "$amount_donated" },
      },
    },
  ]);
  const totalFundsReceived = totalFundsResult[0]?.totalFundsReceived || 0;
  stats.push({ title: "Total Funds Received", value: totalFundsReceived });

  // 2. Care Home Details
  const carehomeDetails = await this.findOne(
    { id_carehome: carehomeId },
    { avg_monthly_expenses: 1, number_of_residents: 1, _id: 0 }
  );

  const avgMonthlyExpense = carehomeDetails?.avg_monthly_expenses || 0;
  const numberOfResidents = carehomeDetails?.number_of_residents || 0;
  const avgCostPerResident = numberOfResidents
    ? (avgMonthlyExpense / numberOfResidents).toFixed(2)
    : 0;

  stats.push(
    { title: "Average Monthly Expense", value: avgMonthlyExpense },
    { title: "Number of Residents", value: numberOfResidents },
    { title: "Average Cost Per Resident", value: avgCostPerResident }
  );

  // 3. Highest Donation
  const highestDonationResult = await DonationMoney.aggregate([
    { $match: { id_carehome: carehomeId } },
    {
      $group: {
        _id: null,
        highestDonation: { $max: "$amount_donated" },
      },
    },
  ]);
  const highestDonation = highestDonationResult[0]?.highestDonation || 0;
  stats.push({ title: "Highest Donation", value: highestDonation });

  return stats;
};

carehomeSchema.statics.recentDonations = async function (careId) {
  try {
    // Step 1: Get all donations for the given carehome, sorted by date descending
    const donations = await DonationMoney.find({ id_carehome: careId }).sort({
      donated_at: -1,
    });

    if (donations.length === 0) {
      return [];
    }

    // Step 2: Get donor names for each donation
    const result = await Promise.all(
      donations.map(async (donation) => {
        try {
          const donor = await User.findOne({ id_donor: donation.id_donor });
          return {
            donor_name: donor ? donor.name : "Anonymous",
            amount: donation.amount_donated,
          };
        } catch (err) {
          // In case of error fetching donor, still include the donation
          return {
            donor_name: "Anonymous",
            amount: donation.amount_donated,
          };
        }
      })
    );

    return result;
  } catch (err) {
    console.error("Error fetching recent donations:", err);
    throw err; // You can handle this error in your route/controller
  }
};
const Carehome = mongoose.model("Carehome", carehomeSchema);
const DonationMoney = mongoose.model("DonationMoney", donationMoneySchema);

module.exports = { Carehome, DonationMoney };

