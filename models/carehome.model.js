const db = require("../data/sqlite3");
const bcrypt = require("bcryptjs");

const today = new Date();
const isoCurrentDate = `${today.getFullYear()}-${String(
  today.getMonth() + 1
).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

class Carehome {
  constructor(
    name,
    reg_number,
    email,
    password,
    contact,
    state,
    city,
    num_residents,
    avg_expense,
    wishlist,
    description,
    admin_name,
    account_holder,
    account_number,
    ifsc
  ) {
    this.name = name;
    this.reg_number = reg_number;
    this.email = email;
    this.password = password;
    this.contact = contact;
    this.state = state;
    this.city = city;
    this.num_residents = num_residents;
    this.avg_expense = avg_expense;
    this.wishlist = wishlist;
    this.description = description;
    this.admin_name = admin_name;
    this.account_holder = account_holder;
    this.account_number = account_number;
    this.ifsc = ifsc;
  }

  async storeCarehome() {
    const hashedPassword = await bcrypt.hash(this.password, 12);
    const sql = `
  INSERT INTO carehomes (
    name_carehome,
    email,
    password,
    mobile,
    govt_id,
    bank_acc_holder_name,
    IFSC_code,
    bank_acc_number,
    wishlist,
    state,
    city,
    description,
    number_of_residents,
    avg_monthly_expenses
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

    db.run(
      sql,
      [
        this.name_carehome,
        this.email,
        hashedPassword,
        this.mobile,
        this.govt_id,
        this.bank_acc_holder_name,
        this.IFSC_code,
        this.bank_acc_number,
        this.wishlist,
        this.state,
        this.city,
        this.description,
        this.number_of_residents,
        this.avg_monthly_expenses
      ],
      (err) => {
        if (err) {
          console.error("Error inserting carehome data:", err);
        } else {
          console.log("Carehome data inserted successfully.");
        }
      }
    );
  }

  static getCareHomes() {
    return new Promise((resolve, reject) => {
      const query = "SELECT id_carehome, name_carehome FROM carehomes";

      db.all(query, [], (err, rows) => {
        if (err) {
          console.error("Error fetching care homes:", err);
          reject(err); // Reject the Promise on error
        } else {
          resolve(rows); // Resolve the Promise with the rows
        }
      });
    });
  }

  static getCarehome(email, callback) {
    const sql = "SELECT * FROM carehomes WHERE email = ?"; // Adjust table name if needed

    db.get(sql, [email], (err, row) => {
      if (err) return callback(err, null);
      return callback(null, row); // Returns a single Carehome or null if not found
    });
  }

  static getname(careid, callback) {
    db.get(
      "SELECT name_carehome FROM carehomes WHERE id_carehome = ?",
      [careid],
      (err, row) => {
        if (err) {
          console.error("Error while getting name_carehome of the ngo:", err);
          callback(err, null);
        } else {
          callback(null, row ? row.name_carehome : null);
        }
      }
    );
  }

  static ongoing_fund(careid, callback) {
    const query = "SELECT * FROM created_fundraisers WHERE id_carehome = ?";
    db.all(query, [careid], (err, rows) => {
      if (err) {
        console.error("Error while getting fund raisers", err);
        callback(err, null);
      } else {
        const ongoing_fund = rows.filter((row) => {
          const isoDate = toISO(row.deadline);
          return isoDate && isoDate >= isoCurrentDate;
        });

        callback(null, ongoing_fund);
      }
    });
  }

  //use it for stats in care home dashboard
  static completed_fund(careid, callback) {
    const query = "SELECT * FROM created_fundraisers WHERE id_carehome = ?";
    db.all(query, [careid], (err, rows) => {
      if (err) {
        console.error("Error fetching completed fundraisers:", err);
        callback(err, null);
      } else {
        const completed_fund = rows.filter((row) => {
          const isoDate = toISO(row.deadline);
          return isoDate && isoDate < isoCurrentDate;
        });
        callback(null, completed_fund);
      }
    });
  }

  static toISO(dateText) {
    if (!dateText) {
      console.warn("Invalid or missing date:", dateText);
      return null;
    }

    try {
      const [day, month, year] = dateText.split("-");
      if (!day || !month || !year) {
        console.warn("Invalid date format:", dateText);
        return null;
      }
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
        2,
        "0"
      )}`;
    } catch (error) {
      console.error("Error parsing date:", dateText, error);
      return null;
    }
  }

  static recentDonations(careid, callback) {
    const query = `
        SELECT 
            id_donor, 
            amount_donated 
        FROM donations_money 
        WHERE id_carehome = ? 
        ORDER BY donated_at DESC
    `;

    db.all(query, [careid], (err, donations) => {
      if (err) {
        console.error("Error while fetching recent donations:", err);
        return callback(err, null);
      }

      if (donations.length === 0) {
        return callback(null, []);
      }

      // Fetch donor details for each donation
      const result = [];
      let processed = 0;

      donations.forEach((donation) => {
        db.get(
          "SELECT name FROM donors WHERE id_donor = ?",
          [donation.id_donor],
          (err, donor) => {
            if (err) {
              console.error("Error fetching donor name:", err);
              // Add donation without donor name
              result.push({
                donor_name: "Anonymous", // Default if donor not found
                amount: donation.amount_donated,
              });
            } else {
              // Add donation with donor name
              result.push({
                donor_name: donor ? donor.name : "Anonymous",
                amount: donation.amount_donated,
              });
            }

            processed++;

            if (processed === donations.length) {
              callback(null, result);
            }
          }
        );
      });
    });
  }

  static get_carehome_stats(carehomeID, callback) {
    const stats = [];

    const queryTotalFundsReceived = `
        SELECT SUM(amount_donated) AS totalFundsReceived 
        FROM donations_money 
        WHERE id_carehome = ?;
    `;

    // Query to get care home details for avg cost per resident, monthly expenses, and number of residents
    const queryCarehomeDetails = `
        SELECT avg_monthly_expenses, number_of_residents 
        FROM carehomes 
        WHERE id_carehome = ?;
    `;

    // Query to get the highest donation for the care home
    const queryHighestDonation = `
        SELECT MAX(amount_donated) AS highestDonation 
        FROM donations_money 
        WHERE id_carehome = ?;
    `;

    // Fetch total funds received
    db.get(queryTotalFundsReceived, [carehomeID], (err, row) => {
      if (err) {
        callback(err, null);
        return;
      }
      stats.push({
        title: "Total Funds Received",
        value: row ? row.totalFundsReceived || 0 : 0,
      });

      // Fetch care home details
      db.get(queryCarehomeDetails, [carehomeID], (err, row) => {
        if (err) {
          callback(err, null);
          return;
        }

        const avgMonthlyExpense = row ? row.avg_monthly_expenses || 0 : 0;
        const numberOfResidents = row ? row.number_of_residents || 0 : 0;
        const avgCostPerResident = numberOfResidents
          ? (avgMonthlyExpense / numberOfResidents).toFixed(2)
          : 0;

        stats.push(
          { title: "Average Monthly Expense", value: avgMonthlyExpense },
          { title: "Number of Residents", value: numberOfResidents },
          { title: "Average Cost Per Resident", value: avgCostPerResident }
        );

        // Fetch highest donation
        db.get(queryHighestDonation, [carehomeID], (err, row) => {
          if (err) {
            callback(err, null);
            return;
          }

          stats.push({
            title: "Highest Donation",
            value: row ? row.highestDonation || 0 : 0,
          });

          // Final callback with formatted stats
          callback(null, stats);
        });
      });
    });
  }

  static getallcarehoms(callback)
  {
    const query = `select * from carehomes`;
    db.all(query,(err,row)=>{
      if(err)
      {
        console.log("error while fetching care homes: ",err)
        return callback(err,null);
      }
      console.log("fetchhed data : ", row);
      callback(null,row);
    })
  }

  static get_care_data(careid,callback)
      {
        const query  = `select * from carehomes where id_carehome = ?`;

        db.all(query,[careid],(err,rows)=>{
          if(err)
          {
            console.log("error occured while getting data from carehomes",err);
            return callback(err,null);
          }
          console.log("data fetched ",rows);
          callback(null,rows);
        })
      }


      
  static getWishlist(careid, callback) {
    const query = `
        SELECT wishlist 
        FROM carehomes 
        WHERE id_carehome = ?
    `;

    db.get(query, [careid], (err, row) => {
      if (err) {
        console.error("Error while fetching wishlist:", err);
        return callback(err, null);
      }

      if (!row || !row.wishlist || row.wishlist.trim() === "") {
        return callback(
          null,
          "Wishlist not available or has not been updated yet."
        );
      }

      return callback(null, row.wishlist);
    });
  }

  static getCarehomeId(email, callback) {
    const sqlQuery = "SELECT id_carehome FROM carehomes WHERE email = ?";

    db.get(sqlQuery, [email], (err, row) => {
      if (err) return callback(err, null);
      callback(null, row ? row.id_carehome : null);
    });
  }

  static getCities() {
    return new Promise((resolve, reject) => {
      const sql = "SELECT DISTINCT city FROM carehomes";

      db.get(sql, [], (err, rows) => {
        if (err) {
          console.error("Error fetching cities:", err);
          reject(err); // Reject the Promise on error
        } else {
          resolve(rows); // Resolve the Promise with the rows
        }
      });
    });
  }

  static getStates() {
    return new Promise((resolve, reject) => {
      const sql = "SELECT DISTINCT state FROM carehomes";

      db.get(sql, [], (err, rows) => {
        if (err) {
          console.error("Error fetching states:", err);
          reject(err); // Reject the Promise on error
        } else {
          resolve(rows); // Resolve the Promise with the rows
        }
      });
    });
  }
}

module.exports = Carehome;
