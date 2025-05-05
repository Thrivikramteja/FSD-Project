// const db = require("../data/sqlite3");
// const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const {CreatedFundraiser, Donor} = require("./user.model"); 
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
  care_img: String,
  terms: String
});

carehomeSchema.plugin(AutoIncrement, { inc_field: "carehomeId" });
const Carehome = mongoose.model('Carehome',  carehomeSchema);

carehomeSchema.statics.getCareHomes = async function () {
  const carehomes = await Carehome.find({}, {_id: 1, care_home_name: 1});
  return carehomes;
}

carehomeSchema.statics.getCarehome = async function (email) {
  const carehome = await Carehome.findOne({email: email});
  return carehome;
}

carehomeSchema.statics.getname = async function (careId) {
  const carehome = await Carehome.findOne({_id: careId});
  return carehome;
}

carehomeSchema.statics.ongoing_fund = async function (careId) {
  const currentDate = new Date();
  const fundraisers = await CreatedFundraiser.find({
    _id: careId,
    deadline: { $gt: currentDate },
  });
  return fundraisers;
}

carehomeSchema.statics.completed_fund = async function (careId) {
  const currentDate = new Date();
  const fundraisers = await CreatedFundraiser.find({
    _id: careId,
    deadline: { $lt: currentDate },
  });
  return fundraisers;
}

carehomeSchema.statics.getallcarehoms = async function () {
  const carehomes = await Carehome.find({});
  return carehomes;
}

carehomeSchema.statics.get_care_data = async function (careId) {
  const carehome = await Carehome.findOne({_id: careId});
  return carehome;
}

carehomeSchema.statics.getWishlist = async function (careId) {
  const carehome = await Carehome.findOne({_id: careId});
  return carehome.wishlist;
}

carehomeSchema.statics.getCarehomeId = async function (email) {
  const carehome = await Carehome.findOne({email});
  return carehome._id;
}

carehomeSchema.statics.getCities = async function () {
  const cities = await Carehome.distinct('city');
  return cities;
}

carehomeSchema.statics.getStates = async function () {
  const states = await Carehome.distinct('state');
  return states;
}

const donationMoneySchema = new mongoose.Schema({
  id_donor: {
    type: Number,
    required: true
  },
  amount_donated: {
    type: Number,
    required: true
  },
  id_carehome: {
    type: Number,
    required: true
  },
  donated_at: {
    type: Date,
    default: Date.now
  }
});

const DonationMoney = mongoose.model('DonationMoney', donationMoneySchema);

carehomeSchema.statics.get_carehome_stats = async function (carehomeId) {
  const stats = [];

  // 1. Total Funds Received
  const totalFundsResult = await DonationMoney.aggregate([
    { $match: { id_carehome: carehomeId } },
    {
      $group: {
        _id: null,
        totalFundsReceived: { $sum: "$amount_donated" }
      }
    }
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
        highestDonation: { $max: "$amount_donated" }
      }
    }
  ]);
  const highestDonation = highestDonationResult[0]?.highestDonation || 0;
  stats.push({ title: "Highest Donation", value: highestDonation });

  return stats;
};

carehomeSchema.statics.recentDonations = async function (careId) {
  try {
    // Step 1: Get all donations for the given carehome, sorted by date descending
    const donations = await DonationMoney.find({ id_carehome: careId })
      .sort({ donated_at: -1 });

    if (donations.length === 0) {
      return [];
    }

    // Step 2: Get donor names for each donation
    const result = await Promise.all(
      donations.map(async (donation) => {
        try {
          const donor = await Donor.findOne({ id_donor: donation.id_donor });
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


module.exports = {Carehome, DonationMoney};

// class Carehome {
//   constructor(
//     care_home_name,
//     reg_number,
//     email,
//     password,
//     contact,
//     state,
//     city,
//     num_residents,
//     avg_expense,
//     wishlist,
//     description,
//     account_holder,
//     account_number,
//     ifsc
//   ) {
//     this.care_home_name = care_home_name;
//     this.reg_number = reg_number;
//     this.email = email;
//     this.password = password;
//     this.contact = contact;
//     this.state = state;
//     this.city = city;
//     this.num_residents = num_residents;
//     this.avg_expense = avg_expense;
//     this.wishlist = wishlist;
//     this.description = description;
//     this.account_holder = account_holder;
//     this.account_number = account_number;
//     this.ifsc = ifsc;
//   }

//   async storeCarehome() {
//     const hashedPassword = await bcrypt.hash(this.password, 12);
//     const sql = `
//       INSERT INTO carehomes (
//         name_carehome,
//         govt_id,
//         email,
//         password,
//         mobile,
//         state,
//         city,
//         number_of_residents,
//         avg_monthly_expenses,
//         wishlist,
//         description,
//         bank_acc_holder_name,
//         bank_acc_number,
//         IFSC_code
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `;

//     db.run(
//       sql,
//       [
//         this.care_home_name,
//         this.reg_number,
//         this.email,
//         hashedPassword,
//         this.contact,
//         this.state,
//         this.city,
//         this.num_residents,
//         this.avg_expense,
//         this.wishlist,
//         this.description,
//         this.account_holder,
//         this.account_number,
//         this.ifsc
//       ],
//       (err) => {
//         if (err) {
//           console.error("Error inserting carehome data:", err);
//         } else {
//           console.log("Carehome data inserted successfully.");
//         }
//       }
//     );
//   }

  // static getCareHomes() {
  //   return new Promise((resolve, reject) => {
  //     const query = "SELECT id_carehome, name_carehome FROM carehomes";

  //     db.all(query, [], (err, rows) => {
  //       if (err) {
  //         console.error("Error fetching care homes:", err);
  //         reject(err); // Reject the Promise on error
  //       } else {
  //         resolve(rows); // Resolve the Promise with the rows
  //       }
  //     });
  //   });
  // }

  // static getCarehome(email, callback) {
  //   const sql = "SELECT * FROM carehomes WHERE email = ?"; // Adjust table name if needed

  //   db.get(sql, [email], (err, row) => {
  //     if (err) return callback(err, null);
  //     return callback(null, row); // Returns a single Carehome or null if not found
  //   });
  // }

  // static getname(careid, callback) {
  //   db.get(
  //     "SELECT name_carehome FROM carehomes WHERE id_carehome = ?",
  //     [careid],
  //     (err, row) => {
  //       if (err) {
  //         console.error("Error while getting name_carehome of the ngo:", err);
  //         callback(err, null);
  //       } else {
  //         callback(null, row ? row.name_carehome : null);
  //       }
  //     }
  //   );
  // }

  // static ongoing_fund(careid, callback) {
  //   const query = "SELECT * FROM created_fundraisers WHERE id_carehome = ?";
  //   db.all(query, [careid], (err, rows) => {
  //     if (err) {
  //       console.error("Error while getting fund raisers", err);
  //       callback(err, null);
  //     } else {
  //       const ongoing_fund = rows.filter((row) => {
  //         const isoDate = Carehome.toISO(row.deadline);
  //         return isoDate && isoDate >= isoCurrentDate;
  //       });

  //       callback(null, ongoing_fund);
  //     }
  //   });
  // }

  //use it for stats in care home dashboard
  // static completed_fund(careid, callback) {
  //   const query = "SELECT * FROM created_fundraisers WHERE id_carehome = ?";
  //   db.all(query, [careid], (err, rows) => {
  //     if (err) {
  //       console.error("Error fetching completed fundraisers:", err);
  //       callback(err, null);
  //     } else {
  //       const completed_fund = rows.filter((row) => {
  //         const isoDate = Carehome.toISO(row.deadline);
  //         return isoDate && isoDate < isoCurrentDate;
  //       });
  //       callback(null, completed_fund);
  //     }
  //   });
  // }

  // static toISO(dateText) {
  //   if (!dateText) {
  //     console.warn("Invalid or missing date:", dateText);
  //     return null;
  //   }

  //   try {
  //     const [day, month, year] = dateText.split("-");
  //     if (!day || !month || !year) {
  //       console.warn("Invalid date format:", dateText);
  //       return null;
  //     }
  //     return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
  //       2,
  //       "0"
  //     )}`;
  //   } catch (error) {
  //     console.error("Error parsing date:", dateText, error);
  //     return null;
  //   }
  // }

  // static recentDonations(careid, callback) {
  //   const query = `
  //       SELECT 
  //           id_donor, 
  //           amount_donated 
  //       FROM donations_money 
  //       WHERE id_carehome = ? 
  //       ORDER BY donated_at DESC
  //   `;

  //   db.all(query, [careid], (err, donations) => {
  //     if (err) {
  //       console.error("Error while fetching recent donations:", err);
  //       return callback(err, null);
  //     }

  //     if (donations.length === 0) {
  //       return callback(null, []);
  //     }

  //     // Fetch donor details for each donation
  //     const result = [];
  //     let processed = 0;

  //     donations.forEach((donation) => {
  //       db.get(
  //         "SELECT name FROM donors WHERE id_donor = ?",
  //         [donation.id_donor],
  //         (err, donor) => {
  //           if (err) {
  //             console.error("Error fetching donor name:", err);
  //             // Add donation without donor name
  //             result.push({
  //               donor_name: "Anonymous", // Default if donor not found
  //               amount: donation.amount_donated,
  //             });
  //           } else {
  //             // Add donation with donor name
  //             result.push({
  //               donor_name: donor ? donor.name : "Anonymous",
  //               amount: donation.amount_donated,
  //             });
  //           }

  //           processed++;

  //           if (processed === donations.length) {
  //             callback(null, result);
  //           }
  //         }
  //       );
  //     });
  //   });
  // }

  // static get_carehome_stats(carehomeID, callback) {
  //   const stats = [];

  //   const queryTotalFundsReceived = `
  //       SELECT SUM(amount_donated) AS totalFundsReceived 
  //       FROM donations_money 
  //       WHERE id_carehome = ?;
  //   `;

  //   // Query to get care home details for avg cost per resident, monthly expenses, and number of residents
  //   const queryCarehomeDetails = `
  //       SELECT avg_monthly_expenses, number_of_residents 
  //       FROM carehomes 
  //       WHERE id_carehome = ?;
  //   `;

  //   // Query to get the highest donation for the care home
  //   const queryHighestDonation = `
  //       SELECT MAX(amount_donated) AS highestDonation 
  //       FROM donations_money 
  //       WHERE id_carehome = ?;
  //   `;

  //   // Fetch total funds received
  //   db.get(queryTotalFundsReceived, [carehomeID], (err, row) => {
  //     if (err) {
  //       callback(err, null);
  //       return;
  //     }
  //     stats.push({
  //       title: "Total Funds Received",
  //       value: row ? row.totalFundsReceived || 0 : 0,
  //     });

  //     // Fetch care home details
  //     db.get(queryCarehomeDetails, [carehomeID], (err, row) => {
  //       if (err) {
  //         callback(err, null);
  //         return;
  //       }

  //       const avgMonthlyExpense = row ? row.avg_monthly_expenses || 0 : 0;
  //       const numberOfResidents = row ? row.number_of_residents || 0 : 0;
  //       const avgCostPerResident = numberOfResidents
  //         ? (avgMonthlyExpense / numberOfResidents).toFixed(2)
  //         : 0;

  //       stats.push(
  //         { title: "Average Monthly Expense", value: avgMonthlyExpense },
  //         { title: "Number of Residents", value: numberOfResidents },
  //         { title: "Average Cost Per Resident", value: avgCostPerResident }
  //       );

  //       // Fetch highest donation
  //       db.get(queryHighestDonation, [carehomeID], (err, row) => {
  //         if (err) {
  //           callback(err, null);
  //           return;
  //         }

  //         stats.push({
  //           title: "Highest Donation",
  //           value: row ? row.highestDonation || 0 : 0,
  //         });

  //         // Final callback with formatted stats
  //         callback(null, stats);
  //       });
  //     });
  //   });
  // }

  // static getallcarehoms(callback)
  // {
  //   const query = `select * from carehomes`;
  //   db.all(query,(err,row)=>{
  //     if(err)
  //     {
  //       console.log("error while fetching care homes: ",err)
  //       return callback(err,null);
  //     }
  //     console.log("fetchhed data : ", row);
  //     callback(null,row);
  //   })
  // }

  // static get_care_data(careid,callback)
  //     {
  //       const query  = `select * from carehomes where id_carehome = ?`;

  //       db.all(query,[careid],(err,rows)=>{
  //         if(err)
  //         {
  //           console.log("error occured while getting data from carehomes",err);
  //           return callback(err,null);
  //         }
  //         console.log("data fetched ",rows);
  //         callback(null,rows);
  //       })
  //     }


      
  // static getWishlist(careid, callback) {
  //   const query = `
  //       SELECT wishlist 
  //       FROM carehomes 
  //       WHERE id_carehome = ?
  //   `;

  //   db.get(query, [careid], (err, row) => {
  //     if (err) {
  //       console.error("Error while fetching wishlist:", err);
  //       return callback(err, null);
  //     }

  //     if (!row || !row.wishlist || row.wishlist.trim() === "") {
  //       return callback(
  //         null,
  //         "Wishlist not available or has not been updated yet."
  //       );
  //     }

  //     return callback(null, row.wishlist);
  //   });
  // }

  // static getCarehomeId(email, callback) {
  //   const sqlQuery = "SELECT id_carehome FROM carehomes WHERE email = ?";

  //   db.get(sqlQuery, [email], (err, row) => {
  //     if (err) return callback(err, null);
  //     callback(null, row ? row.id_carehome : null);
  //   });
  // }

  // static getCities() {
  //   return new Promise((resolve, reject) => {
  //     const sql = "SELECT DISTINCT city FROM carehomes";

  //     db.get(sql, [], (err, rows) => {
  //       if (err) {
  //         console.error("Error fetching cities:", err);
  //         reject(err); // Reject the Promise on error
  //       } else {
  //         resolve(rows); // Resolve the Promise with the rows
  //       }
  //     });
  //   });
  // }

//   static getStates() {
//     return new Promise((resolve, reject) => {
//       const sql = "SELECT DISTINCT state FROM carehomes";

//       db.get(sql, [], (err, rows) => {
//         if (err) {
//           console.error("Error fetching states:", err);
//           reject(err); // Reject the Promise on error
//         } else {
//           resolve(rows); // Resolve the Promise with the rows
//         }
//       });
//     });
//   }
// }


