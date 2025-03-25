const db = require("../data/sqlite3");
const bcrypt = require("bcryptjs");

class User {
  constructor(name, email, password, contact, checkbox) {
    (this.email = email), (this.password = password), (this.name = name);
    this.contact = contact;
    this.checkbox = checkbox;
  }

  // getUserWithSameEmail() {
  //   return db.get(
  //     "SELECT * FROM donors WHERE email = ?",
  //     [this.email],
  //     (err, row) => {
  //       if (err) return callback(err, null);
  //       return callback(null, row);
  //     }
  //   );
  // }

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
      [this.name, this.email, hashedPassword, this.contact, this.checkbox ? this.checkbox : 'off'],
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
}

module.exports = User;
