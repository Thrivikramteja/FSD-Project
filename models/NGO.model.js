const db = require("../data/sqlite3");

class NGO {
  constructor(
    name,
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
    this.name = name;
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
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
}


static create_event(eventDetails, callback) {
    const { id_NGO, event_location, event_name, event_date, event_time, number_of_registrations, description } = eventDetails;

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
            console.error('Error while inserting new event:', err);
            callback(err, null);
        } else {
            callback(null, { id: this.lastID, ...eventDetails });
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


static create_fundraiser(fundraiserDetails, callback) {
    const { 
        id_carehome, 
        fundraiser_name, 
        id_NGO, 
        has_report, 
        goal_amount, 
        description, 
        amount_raised_so_far, 
        deadline 
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
        deadline
    ];

    db.run(query, values, function (err) {
        if (err) {
            console.error('Error while inserting new fundraiser:', err);
            callback(err, null);
        } else {
            callback(null, { id: this.lastID, ...fundraiserDetails });
        }
    });
}



module.exports = NGO;
