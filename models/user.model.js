const db = require("../data/sqlite3");

class User {
  constructor(email, password, name) {
    (this.email = email),
      (this.password = password),
      (this.fullname = fullname);
  }

  static userExists(email) {
    let sqlQuery = "SELECT * FROM users WHERE email = ?"
    db.run(sqlQuery, [email], function (err) {
      
    })
  }

  static writeUSER(data) {
   
  }
}

module.exports = User;
