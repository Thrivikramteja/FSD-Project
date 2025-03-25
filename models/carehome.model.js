const db = require("../data/sqlite3");
const bcrypt = require("bcryptjs");

class Carehome {
  constructor(
    name,
    reg_number,
    email,
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

  static getCareHomes(callback) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT id_carehome, name_carehome FROM carehomes';
      
      db.all(query, [], (err, rows) => {
          if (err) {
              console.error('Error fetching care homes:', err);
              reject(err);  // Reject the Promise on error
          } else {
              resolve(rows); // Resolve the Promise with the rows
          }
      })
    })
  }

  getCarehomeId(email, callback) {
    const sqlQuery = "SELECT id_carehome FROM carehomes WHERE email = ?";

    db.get(sqlQuery, [email], (err, row) => {
      if (err) return callback(err, null);
      callback(null, row ? row.id_carehome : null); 
    });
  }
}

module.exports = Carehome;
