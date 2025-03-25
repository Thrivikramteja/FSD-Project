const db = require("../data/sqlite3");
const bcrypt = require("bcryptjs");
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

  async register() {
    const hashedPassword = await bcrypt.hash(this.password, 12);

    const sqlQuery =
      "INSERT INTO NGOs (name_NGO, email, password, darpan_id, bank_acc_holder_name, IFSC_code, bank_acc_number, funds_raised, YOE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);";

    db.run(
      sqlQuery,
      [
        this.name,
        this.email,
        hashedPassword,
        this.darpan_id,
        this.account_holder_name,
        this.ifsc,
        this.account_number,
        this.funds_raised,
        this.year_established,
      ],
      (err) => {
        if (err) {
          console.error("Error inserting NGO:", err);
        } else {
          console.log("NGO successfully inserted.");
        }
      }
    );
  }

  static getNGO(email, callback) {
    const sqlQuery = "SELECT * FROM NGOs WHERE email = ?";

    db.get(sqlQuery, [email], (err, row) => {
      if (err) return callback(err, null);
      callback(null, row ? row.id_NGO : null);
    });
  }

  static getFundraisers(callback) { 
    const sqlQuery = "SELECT * FROM created_fundraisers;";

    db.all(sqlQuery, (err, rows) => {
      if (err) {
        console.error("Error fetching fundraisers:", err);
        callback(err, null);
      } else {
        callback(null, rows);
      }
    });
  }

  static getEvents(callback) {
    const sqlQuery = "SELECT * FROM created_events;";

    db.all(sqlQuery, (err, rows) => {
      if (err) {
        console.error("Error fetching Events:", err);
        callback(err, null);
      } else {
        callback(null, rows);
      }
    });
  }
}

module.exports = NGO;
