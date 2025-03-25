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

module.exports = NGO;
