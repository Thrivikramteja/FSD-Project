const db = require("../data/sqlite3");
const bcrypt = require("bcryptjs");

const today = new Date();
const isoCurrentDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
class NGO {
  constructor(
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
  ) {
    this.Ngoname = Ngoname;
    this.darpan_id = darpan_id;
    this.year_established = year_established;
    this.email = email;
    this.password = password;
    this.phone = phone;
    this.address = address;
    this.account_holder_name = account_holder_name;
    this.account_number = account_number;
    this.ifsc = ifsc;
  }

  async storeNGO() {
    const hashedPassword = await bcrypt.hash(this.password, 12);
    const sql =
      "INSERT INTO NGOs (name_NGO, email, password, darpan_id, bank_acc_holder_name, phone, IFSC_code, bank_acc_number, YOE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

    db.run(
      sql,
      [
        this.Ngoname,
        this.email,
        hashedPassword,
        this.darpan_id,
        this.account_holder_name,
        this.phone,
        this.ifsc,
        this.account_number,
        this.year_established,
      ],
      (err) => {
        console.log(err);
      }
    );
  }

  static getNGOById(id, callback) {
    const sql = "SELECT * FROM NGOs WHERE id_NGO = ?";
    db.get(sql, [id], (err, row) => {
      if (err) return callback(err, null);
      return callback(null, row); // Returns a single NGO or null if not found
    });
  }

  static getNGO(email, callback) {
    const sql = "SELECT * FROM NGOs WHERE email = ?";
    db.get(sql, [email], (err, row) => {
      if (err) return callback(err, null);
      return callback(null, row); // Returns a single NGO or null if not found
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

  static ongoing_fund(callback) {
    const query = "SELECT * FROM created_fundraisers";
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error("Error while getting fundraisers", err);
        callback(err, null);
      } else {
        const isoCurrentDate = new Date().toISOString().split("T")[0];
        const ongoing_fund = rows.filter((row) => {
          const isoDate = NGO.toISO(row.deadline);
          return isoDate && isoDate >= isoCurrentDate;
        });

        callback(null, ongoing_fund);
      }
    });
  }

  static getname(ngoId, callback) {
    db.get(
      "SELECT name_NGO FROM NGOs WHERE id_NGO = ?",
      [ngoId],
      (err, row) => {
        if (err) {
          console.error("Error while getting name_NGO of the ngo:", err);
          callback(err, null);
        } else {
          callback(null, row ? row.name_NGO : null);
        }
      }
    );
  }

  static ongoing_funds(ngoId, callback) {
    const query = "SELECT * FROM created_fundraisers WHERE id_NGO = ?";
    db.all(query, [ngoId], (err, rows) => {
      if (err) {
        console.error("Error while getting fund raisers", err);
        callback(err, null);
      } else {
        const ongoing_fund = rows.filter((row) => {
          const isoDate = this.toISO(row.deadline);
          return isoDate && isoDate >= isoCurrentDate;
        });

        callback(null, ongoing_fund);
      }
    });
  }

  static completed_fund(ngoId, callback) {
    const query = "SELECT * FROM created_fundraisers WHERE id_NGO = ?";
    db.all(query, [ngoId], (err, rows) => {
      if (err) {
        console.error("Error fetching completed fundraisers:", err);
        callback(err, null);
      } else {
        const completed_fund = rows.filter((row) => {
          const isoDate = this.toISO(row.deadline);
          return isoDate && isoDate < isoCurrentDate;
        });
        callback(null, completed_fund);
      }
    });
  }

  static completed_event(ngoId, callback) {
    const query = "SELECT * FROM created_events WHERE id_NGO = ?";
    db.all(query, [ngoId], (err, rows) => {
      if (err) {
        console.error(
          "Error fetching while fetching events for ngo dashboard:",
          err
        );
        callback(err, null);
      } else {
        const completed_event = rows.filter((row) => {
          const isoDate = this.toISO(row.event_date);
          return isoDate && isoDate < isoCurrentDate;
        });
        callback(null, completed_event);
      }
    });
  }

  static upcoming_eves(ngoId, callback) {
    const query = "SELECT * FROM created_events WHERE id_NGO = ?";
    db.all(query, [ngoId], (err, rows) => {
      if (err) {
        console.error("Error fetching upcoming events for ngo dashboard:", err);
        callback(err, null);
      } else {
        const upcoming_eve = rows.filter((row) => {
          const isoDate = this.toISO(row.event_date);
          return isoDate && isoDate >= isoCurrentDate;
        });
        callback(null, upcoming_eve);
      }
    });
  }

  static upcoming_eve(callback) {
    const query = "SELECT * FROM created_events";
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error("Error fetching upcoming events:", err);
        callback(err, null);
      } else {
        const isoCurrentDate = new Date().toISOString().split("T")[0]; // ✅ Define current ISO date
        const upcoming_eve = rows.filter((row) => {
          const isoDate = NGO.toISO(row.event_date); // ✅ Use NGO.toISO instead of toISO
          return isoDate && isoDate >= isoCurrentDate;
        });

        callback(null, upcoming_eve);
      }
    });
  }

  static get_stats(ngoID, callback) {
    const stats = {
      totalFundsRaised: 0,
      totalRegistrations: 0,
      fundraisersCreated: 0,
      careHomesBenefited: 0,
    };

    const queryFundsRaised = `
        SELECT funds_raised 
        FROM NGOs 
        WHERE id_NGO = ?;
    `;

    const queryTotalRegistrations = `
        SELECT SUM(number_of_registrations) AS totalRegistrations 
        FROM created_events 
        WHERE id_NGO = ?;
    `;

    const queryFundraisersAndCareHomes = `
        SELECT COUNT(*) AS fundraisersCreated, COUNT(DISTINCT id_carehome) AS careHomesBenefited 
        FROM created_fundraisers 
        WHERE id_NGO = ?;
    `;

    db.get(queryFundsRaised, [ngoID], (err, row) => {
      if (err) {
        callback(err, null);
        return;
      }
      stats.totalFundsRaised = row ? row.funds_raised : 0;

      db.get(queryTotalRegistrations, [ngoID], (err, row) => {
        if (err) {
          callback(err, null);
          return;
        }
        stats.totalRegistrations = row ? row.totalRegistrations : 0;

        db.get(queryFundraisersAndCareHomes, [ngoID], (err, row) => {
          if (err) {
            callback(err, null);
            return;
          }

          stats.careHomesBenefited = row ? row.careHomesBenefited : 0;

          callback(null, stats);
        });
      });
    });
  }

  static create_event(eventDetails, callback) {
    const {
      id_NGO,
      event_location,
      event_name,
      event_date,
      event_time,
      number_of_registrations,
      description,
    } = eventDetails;

    const query = `
        INSERT INTO created_events (id_NGO, event_location, event_name, event_date, event_time, number_of_registrations, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      id_NGO,
      event_location,
      event_name,
      event_date,
      event_time,
      number_of_registrations || 0,
      description,
    ];

    db.run(query, values, function (err) {
      if (err) {
        console.error("Error while inserting new event:", err);
        callback(err, null);
      } else {
        callback(null, { id: this.lastID, ...eventDetails });
      }
    });
  }

  static get_all_ngos(callback)
  {
    const query = 'select * from NGOs';
    db.all(query,[],(err,rows)=>{
      if(err)
      {
        console.log("error while fetching NGOs ",err);
        return callback(err,null);
      }
      callback(null,rows);
    })
  }

  static get_carehome(callback) {
    const query = `
        SELECT id_carehome, name_carehome
        FROM carehomes
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        console.error("Error fetching care home details:", err);
        callback(err, null);
      } else {
        callback(null, rows); // Return all care homes as an array of objects
      }
    });
  }

  static create_fundraiser(fundraiserDetails, callback) {
    const {
      id_carehome,
      fundraiser_name,
      id_NGO,
      has_report,
      goal_amount,
      description,
      amount_raised_so_far,
      deadline,
    } = fundraiserDetails;

    const query = `
        INSERT INTO created_fundraisers (id_carehome, fundraiser_name, id_NGO, has_report, goal_amount, description, amount_raised_so_far, deadline)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      id_carehome,
      fundraiser_name,
      id_NGO,
      has_report || 0, // Default to 0 if not provided
      goal_amount || 0, // Default to 0 if not provided
      description,
      amount_raised_so_far || 0, // Default to 0 if not provided
      deadline,
    ];

    db.run(query, values, function (err) {
      if (err) {
        console.error("Error while inserting new fundraiser:", err);
        callback(err, null);
      } else {
        callback(null, { id: this.lastID, ...fundraiserDetails });
      }
    });
  }

  
}


module.exports = NGO;
