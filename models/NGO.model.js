const db = require("../data/database");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const today = new Date();
const isoCurrentDate = `${today.getFullYear()}-${String(
  today.getMonth() + 1
).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

const ngoSchema = new mongoose.Schema({
  Ngoname: String,
  darpan_id: String,
  year_established: Number,
  email: { type: String, required: true, unique: true },
  password: String,
  phone: String,
  address: String,
  account_holder_name: String,
  account_number: String,
  ifsc: String
});

const NGO = mongoose.model('NGO', ngoSchema);



ngoSchema.methods.storeNGO = async function storeNGO() {
  try {
    this.password = await bcrypt.hash(this.password, 12);

    return await this.save();
  } catch (err) {
    throw err;
  }
}

  // async storeNGO() {
    
  //   const sql =
  //     "INSERT INTO NGOs (name_NGO, email, password, darpan_id, bank_acc_holder_name, phone, IFSC_code, bank_acc_number, YOE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

  //   db.run(
  //     sql,
  //     [
  //       this.Ngoname,
  //       this.email,
  //       hashedPassword,
  //       this.darpan_id,
  //       this.account_holder_name,
  //       this.phone,
  //       this.ifsc,
  //       this.account_number,
  //       this.year_established,
  //     ],
  //     (err) => {
  //       console.log(err);
  //     }
  //   );
  // }

  ngoSchema.statics.getNGOById = async function getNGOById(id) {
    try {
      const ngo = this.findById(id);
      return ngo;
    } catch (err) {
      throw new Error('NGO not found or invalid ID');
    }
  }
  // static getNGOById(id, callback) {
  //   const sql = "SELECT * FROM NGOs WHERE id_NGO = ?";
  //   db.get(sql, [id], (err, row) => {
  //     if (err) return callback(err, null);
  //     return callback(null, row); // Returns a single NGO or null if not found
  //   });
  // }

  ngoSchema.statics.getNGO = async function getNGO(email) {
    try {
      const ngo = this.find({email: email});
      return ngo;
    } catch (err) {
      throw new Error('NGO not found or invalid ID');
    }
  }

  // static getNGO(email, callback) {
  //   const sql = "SELECT * FROM NGOs WHERE email = ?";
  //   db.get(sql, [email], (err, row) => {
  //     if (err) return callback(err, null);
  //     return callback(null, row); // Returns a single NGO or null if not found
  //   });
  // }

  ngoSchema.statics.getId = async function getId(email) {
    try {
      const ngo = this.find({email: email});
      return ngo.id;
    } catch (err) {
      throw new Error('NGO not found or invalid email.');
    }
  }

  // static getId(email, callback) {
  //   const sql = "SELECT id_NGO FROM NGOs WHERE email = ?";

  //   db.get(sql, [email], (err, row) => {
  //     if (err) return callback(err, null);
  //     return callback(null, row);
  //   });
  // }

  function toISO(dateText) {
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

  // static get_ngo_data(ngoID, callback) {
  //   const query = "select * from NGOs where id_NGO = ?";
  //   db.get(query, [ngoID], (err, rows) => {
  //     if (err) {
  //       console.error("Error fetching user data:", err);
  //       callback(err, null);
  //     } else {
  //       callback(null, rows);
  //     }
  //   });
  // }

  static ongoing_fund(callback) {
    const query = "SELECT * FROM created_fundraisers";
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error("Error while getting fundraisers", err);
        callback(err, null);
      } else {
        const isoCurrentDate = new Date().toISOString().split("T")[0];
        const ongoing_fund = rows.filter((row) => {
          const isoDate = toISO(row.deadline);
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

  static get_all_ngos(callback) {
    const query = "select * from NGOs";
    db.all(query, [], (err, rows) => {
      if (err) {
        console.log("error while fetching NGOs ", err);
        return callback(err, null);
      }
      callback(null, rows);
    });
  }

  static specific_events(ngoID, callback) {
    const query = `SELECT * FROM created_events WHERE id_NGO = ?`;

    db.all(query, [ngoID], (err, rows) => {
      if (err) {
        console.error("Error fetching specific events:", err);
        return callback(err, null);
      }

      try {
        // Filter rows to include only events with a date >= today's date
        const filteredEvents = rows.filter((row) => {
          const isoDate = this.toISO(row.event_date); // Convert event_date to ISO format
          return isoDate && isoDate >= isoCurrentDate; // Compare with today's ISO date
        });

        callback(null, filteredEvents);
      } catch (filterError) {
        console.error("Error filtering events:", filterError);
        callback(filterError, null);
      }
    });
  }

  static event_load(ngoID, event_name, callback) {
    const query = `select * from created_events where id_NGO = ? and event_name = ?`;

    db.get(query, [ngoID, event_name], (err, rows) => {
      if (err) {
        console.log("error fetching event details");
        return callback(err, null);
      }

      callback(null, rows);
    });
  }

  static edit_event(eventDetails, callback) {
    const {
      id_NGO,
      original_event_name, // Original event name to identify the event
      new_event_name, // New event name (title)
      event_location,
      event_date,
      event_time,
      description,
    } = eventDetails;

    const query = `
        UPDATE created_events
        SET event_name = ?, 
            event_location = ?, 
            event_date = ?, 
            event_time = ?, 
            description = ?
        WHERE id_NGO = ? AND event_name = ?
    `;

    const values = [
      new_event_name || original_event_name, // Default to original name if new name not provided
      event_location,
      event_date,
      event_time,
      description,
      id_NGO,
      original_event_name,
    ];

    db.run(query, values, function (err) {
      if (err) {
        console.error("Error while updating event:", err);
        callback(err, null);
      } else if (this.changes === 0) {
        callback(new Error("No event found to update."), null);
      } else {
        callback(null, { success: true, ...eventDetails });
      }
    });
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

  static update_profile(updationDetails, callback) {
    const { id_NGO, fullname, darpan, phone, bank, accnum, ifsc } =
      updationDetails;

    const query = `UPDATE NGOs SET name_NGO = ?, darpan_id = ?, bank_acc_holder_name = ?, phone = ?, IFSC_code = ?, bank_acc_number = ? WHERE id_NGO = ?`;

    const values = [fullname, darpan, bank, phone, ifsc, accnum, id_NGO];

    db.run(query, values, function (err) {
      if (err) {
        console.error("Error while inserting new fundraiser:", err);
        callback(err, null);
      } else {
        callback(null, { id: this.lastID, ...updationDetails });
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


const NGO = mongoose.model('NGO', ngoSchema);
module.exports = NGO;
