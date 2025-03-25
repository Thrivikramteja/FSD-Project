const db = require("../data/sqlite3");
const bcrypt = require("bcryptjs");

class User {
  constructor(name, email, password, contact, checkbox) {
    (this.email = email), (this.password = password), (this.name = name);
    this.contact = contact;
    this.checkbox = checkbox;
  }

  existsAlready(email) {
    return new Promise((resolve, reject) => {
      console.log("Checking existence for email:", email);
      const sqlQuery = "SELECT * FROM donors WHERE email = ?";

      db.get(sqlQuery, [email], (err, row) => {
        if (err) {
          reject(err);
        } else {
          console.log("Query result:", row);
          resolve(!!row);
        }
      });
    });
  }

  async signup() {
    const hashedPassword = await bcrypt.hash(this.password, 12);

    const sqlQuery =
      "INSERT INTO donors (name, email, password, mobile_number, receive_notifications) VALUES (?, ?, ?, ?, ?)";
    console.log(this.email);
    console.log(this.contact);
    console.log(this.name);
    console.log(this.checkbox);
    db.run(
      sqlQuery,
      [
        this.name,
        this.email,
        hashedPassword,
        this.contact,
        this.checkbox ? this.checkbox : "off",
      ],
      (err) => {
        if (err) {
          console.error("error in signup: ", err);
        } else {
          console.log("signup done.");
        }
      }
    );

    db.get("SELECT * FROM donors WHERE email = ?", [this.email], (err, row) => {
      if (err) {
        console.error(err);
      }
      if (row) {
        console.log(row);
      }
    });
  }

  hasMatchingPassword(hashedPassword) {
    return bcrypt.compare(this.password, hashedPassword);
  }

  toISO(dateText) {
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

  getname(userId, callback) {
    db.get(
      "SELECT name FROM donors WHERE id_donor = ?",
      [userId],
      (err, row) => {
        if (err) {
          console.error("Error while getting name of the donor:", err);
          callback(err, null);
        } else {
          callback(null, row ? row.name : null);
        }
      }
    );
  }

  participatedEvents(userId, callback) {
    const query = "SELECT * FROM user_registered_events WHERE id_donor = ?";
    db.all(query, [userId], (err, rows) => {
      if (err) {
        console.error("Error while getting participated events:", err);
        callback(err, null);
      } else {
        const participatedEvents = rows.filter((row) => {
          const isoDate = toISO(row.event_date);
          return isoDate && isoDate < isoCurrentDate;
        });

        callback(null, participatedEvents);
      }
    });
  }

  contributedFundraisers(userId, callback) {
    const query =
      "SELECT * FROM user_contributed_fundraisers WHERE id_donor = ?";
    db.all(query, [userId], (err, rows) => {
      if (err) {
        console.error("Error fetching contributed fundraisers:", err);
        callback(err, null);
      } else {
        const contributedFundraisers = rows.filter((row) => {
          const isoDate = toISO(row.deadline);
          return isoDate && isoDate < isoCurrentDate;
        });
        callback(null, contributedFundraisers);
      }
    });
  }

  ongoingfund(userId, callback) {
    const query =
      "SELECT * FROM user_contributed_fundraisers WHERE id_donor = ?";
    db.all(query, [userId], (err, rows) => {
      if (err) {
        console.error("Error fetching contributed fundraisers:", err);
        callback(err, null);
      } else {
        const ongoingFund = rows.filter((row) => {
          const isoDate = toISO(row.deadline);
          return isoDate && isoDate >= isoCurrentDate;
        });
        callback(null, ongoingFund);
      }
    });
  }

  upcomingEvents(userId, callback) {
    const query = "SELECT * FROM user_registered_events WHERE id_donor = ?";
    db.all(query, [userId], (err, rows) => {
      if (err) {
        console.error("Error fetching upcoming events:", err);
        callback(err, null);
      } else {
        const upcomingEvents = rows.filter((row) => {
          const isoDate = toISO(row.event_date);
          return isoDate && isoDate >= isoCurrentDate;
        });
        callback(null, upcomingEvents);
      }
    });
  }
}

module.exports = User;
