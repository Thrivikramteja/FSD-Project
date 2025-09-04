const mongoose = require("mongoose");
const { CreatedFundraiser, User } = require("./user.model");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const { donate_items_mes} = require('./user.model');

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
    required: true
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

donationitemschema.statics.get_item_donations = async function(carehomeId) {
  const donations = await this.find({ carehomeId: carehomeId })
    .sort({ donated_at: -1 }) // Sort by `donated_at` in descending order (newest first)
    .limit(4); // Limit to the first 4 results
  console.log("I am from model (sorted and limited): ", donations);
  return donations;
};


donationMoneySchema.statics.saveDonation = async function({ userId, amount_donated, carehomeId }) {
  const donation = new this({
    userId,
    amount_donated,
    carehomeId,
    donated_at: new Date()
  });

  await donation.save();
};

carehomeSchema.statics.get_carehome_stats = async function (carehomeId) {
  const stats = [];

  // 1. Total Funds Received
  const totalFundsResult = await DonationMoney.aggregate([
    { $match: { carehomeId: carehomeId } },
    {
      $group: {
        _id: null,
        totalFundsReceived: { $sum: "$amount_donated" },
      },
    },
  ]);
  const totalFundsReceived = totalFundsResult[0]?.totalFundsReceived || 0;
  stats.push({ title: "Total Funds Received", value: totalFundsReceived });


  const carehomeDetails = await this.findOne(
    {carehomeId: carehomeId},
    { avg_expense: 1, num_residents: 1, _id: 0 }
  );

  const avgMonthlyExpense = carehomeDetails?.avg_expense || 0;
  const numberOfResidents = carehomeDetails?.num_residents || 0;
  const avgCostPerResident = numberOfResidents
    ? (avgMonthlyExpense / numberOfResidents).toFixed(2)
    : 0;

  stats.push(
    { title: "Average Monthly Expense", value: avgMonthlyExpense },
    { title: "Number of Residents", value: numberOfResidents },
    { title: "Average Cost Per Resident", value: avgCostPerResident }
  );

  
  const highestDonationResult = await DonationMoney.aggregate([
    { $match: { carehomeId: carehomeId } },
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
   
    const donations = await DonationMoney.find({ carehomeId: careId }).sort({
      donated_at: -1,
    });
    
    if (donations.length === 0) {
      return [];
    }
    
    
    const result = [];
    
    for (const donation of donations) {
      try {
        const donor = await User.findOne({ id_donor: donation.id_donor });
        
        result.push({
          donor_name: donor ? donor.name : "Anonymous",
          amount: donation.amount_donated,
        });
      } catch (err) {
        
        result.push({
          donor_name: "Anonymous",
          amount: donation.amount_donated,
        });
      }
    }
    
    return result;
  } catch (err) {
    console.error("Error fetching recent donations:", err);
    throw err;
  }
};

carehomeSchema.statics.getMessages = async function (carehomeId)
{
try
{
  const messages = await donate_items_mes.find({carehomeId: carehomeId});
  return messages;
}
catch(error)
{
  console.log("error while getting messages: " + error);
  throw error;
}
};


const Carehome = mongoose.model("Carehome", carehomeSchema);
const DonationMoney = mongoose.model("DonationMoney", donationMoneySchema);
const donate_items = mongoose.model("donate_items",donationitemschema);
module.exports = { Carehome, DonationMoney , donate_items};