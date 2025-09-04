//hi i am admin 

const {  User, CreatedFundraiser, UserContributedFundraiser, UserRegisteredEvent,donate_items_mes, user_message} = require('./user.model');

const { NGO, Event} = require('./NGO.model');

const { Carehome, DonationMoney , donate_items } = require('./carehome.model');
const { default: mongoose } = require('mongoose');


const adminschema = new mongoose.Schema({
    // null schema
});

adminschema.statics.highest_Donation = async function() {
    const highestDonation = await DonationMoney.findOne()
      .sort({ amount_donated: -1 }) 
      .limit(1); 
  
    return highestDonation.amount_donated;
  };

adminschema.statics.highest_contributor_with_name = async function() {
    const highestContributor = await UserContributedFundraiser.aggregate([
      {
        $group: {
          _id: "$userId", 
          total_contributed: { $sum: "$amount_contributed" }
        }
      },
      {
        $sort: { total_contributed: -1 } 
      },
      {
        $limit: 1 
      }
    ]);
  
    if (highestContributor.length === 0) {
      return null;
    }
  
    const userId = highestContributor[0]._id;
  
   
    const donor = await mongoose.model('Donor').findOne({ userId });
  
    return {
      userId,
      name: donor ? donor.name : "Unknown",
      total_contributed: highestContributor[0].total_contributed,
    };
  };
  
adminschema.statics.total_revenue = async function() {
    
    const userFundraiserRevenue = await UserContributedFundraiser.aggregate([
      {
        $group: {
          _id: null, // Group all documents
          total_contributed: { $sum: "$amount_contributed" }, // Sum up contributions
        },
      },
    ]);
  
    // Calculate total donations from DonationMoney
    const donationRevenue = await DonationMoney.aggregate([
      {
        $group: {
          _id: null, // Group all documents
          total_donated: { $sum: "$amount_donated" }, // Sum up donations
        },
      },
    ]);
  
    // Extract the totals or default to 0 if no records are found
    const fundraiserTotal = userFundraiserRevenue[0]?.total_contributed || 0;
    const donationTotal = donationRevenue[0]?.total_donated || 0;
  
    // Calculate the revenue (8% of total amounts)
    const totalRevenue = (fundraiserTotal + donationTotal) * 0.08;
  
    console.log("Fundraiser Total: ", fundraiserTotal);
    console.log("Donation Total: ", donationTotal);
    console.log("Total Revenue (8%): ", totalRevenue);
  
    return totalRevenue.toFixed(2);
  };

adminschema.statics.total_ngo = async function()
  {
    const total_ngos = await NGO.countDocuments();
    return total_ngos;
  };

adminschema.statics.total_care = async function()
  {
    const total_care = await Carehome.countDocuments();
    return total_care;
  }

adminschema.statics.total_money = async function()
  {
    const userFundraiserRevenue = await UserContributedFundraiser.aggregate([
        {
          $group: {
            _id: null, // Group all documents
            total_contributed: { $sum: "$amount_contributed" }, // Sum up contributions
          },
        },
      ]);
    
      
      const donationRevenue = await DonationMoney.aggregate([
        {
          $group: {
            _id: null, 
            total_donated: { $sum: "$amount_donated" }, 
          },
        },
      ]);
    
      
      const fundraiserTotal = userFundraiserRevenue[0]?.total_contributed || 0;
      const donationTotal = donationRevenue[0]?.total_donated || 0;
    
      
      const totalRevenue = (fundraiserTotal + donationTotal);
    
      console.log("Fundraiser Total: ", fundraiserTotal);
      console.log("Donation Total: ", donationTotal);
      console.log("Total Revenue (8%): ", totalRevenue);
    
      return totalRevenue;
  }

adminschema.statics.total_events = async function()
  {
    const today  = new Date();
    const total_events = await Event.countDocuments({
        event_date: { $gte: today }, // Filters events where event_date is greater than or equal to today
      });

      return total_events;
  }


adminschema.statics.top_fund = async function() {
    try {
      const today = new Date(); 
  
      const top_fundraisers = await CreatedFundraiser
        .find({ deadline: { $gte: today } }) 
        .sort({ amount_raised_so_far: -1 }) 
        .limit(3); 
  
      console.log("Top 3 fundraisers based on amount raised (and valid deadlines):", top_fundraisers); // Debugging log
      return top_fundraisers; 
    } catch (err) {
      console.error("Error while fetching top fundraisers:", err);
      throw err; 
    }
  };


  const admin = mongoose.model("admin",adminschema);

  module.exports= {
    admin,
  }