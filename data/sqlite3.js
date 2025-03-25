const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database(":memory:", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite in-memory database.");

    db.exec(
      `CREATE TABLE donors (
        id_donor INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        mobile_number TEXT,
        receive_notifications BLOB
      );

      CREATE TABLE carehomes (
        id_carehome INTEGER PRIMARY KEY AUTOINCREMENT,
        name_carehome TEXT,
        email TEXT UNIQUE,
        password TEXT,
        govt_id TEXT,
        bank_acc_holder_name TEXT,
        IFSC_code TEXT,
        bank_acc_number TEXT,
        state TEXT,
        city TEXT,
        description TEXT,
        number_of_residents INTEGER,
        avg_monthly_expenses INTEGER
      );

      CREATE TABLE NGOs (
        id_NGO INTEGER PRIMARY KEY AUTOINCREMENT,
        name_NGO TEXT,
        email TEXT UNIQUE,
        password TEXT,
        darpan_id TEXT,
        bank_acc_holder_name TEXT,
        IFSC_code TEXT,
        bank_acc_number TEXT,
        funds_raised INTEGER,
        YOE INTEGER
      );

      CREATE TABLE donations_money (
        id_user INTEGER,
        amount_donated INTEGER,
        id_carehome INTEGER,
        donated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE donations_items (
        id_user INTEGER,
        id_carehome INTEGER,
        type_of_item TEXT,
        donated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE user_contributed_fundraisers (
        id_user INTEGER,
        id_NGO INTEGER,
        fundraiser_name TEXT,
        amount_contributed INTEGER,
        contributed_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE user_registered_events (
        id_user INTEGER,
        id_NGO INTEGER,
        event_name TEXT,
        event_date TEXT,
        event_time TEXT,
        event_location TEXT
      );

      CREATE TABLE created_fundraisers (
        id_carehome INTEGER,
        fundraiser_name TEXT,
        has_report BLOB,
        goal_amount INTEGER,
        description TEXT,
        amount_raised_so_far INTEGER,
        deadline TEXT
      );

      INSERT INTO created_fundraisers (fundraiser_name, has_report, goal_amount, description, amount_raised_so_far) VALUES ("abc", 0, 10000, "abc", 1000);
      INSERT INTO created_fundraisers (fundraiser_name, has_report, goal_amount, description, amount_raised_so_far) VALUES ("def", 0, 90000, "jkl", 2000);
      INSERT INTO created_fundraisers (fundraiser_name, has_report, goal_amount, description, amount_raised_so_far) VALUES ("pqr", 0, 80000, "ghi", 3000);
      INSERT INTO created_fundraisers (fundraiser_name, has_report, goal_amount, description, amount_raised_so_far) VALUES ("mno", 0, 70000, "def", 4000);


      CREATE TABLE created_events (
        id_NGO INTEGER,
        event_image BLOB,
        event_location TEXT,
        event_name TEXT,
        event_date TEXT,
        event_time TEXT,
        number_of_registrations INTEGER,
        description TEXT
      );

      INSERT INTO created_events (event_location, event_name, event_date, event_time, number_of_registrations, description) VALUES ("abc", "def", "11-11-2025", "8:00PM", 1000, "ghi");
      INSERT INTO created_events (event_location, event_name, event_date, event_time, number_of_registrations, description) VALUES ("jkl", "mno", "11-12-2025", "9:00PM", 2000, "qrs");
      INSERT INTO created_events (event_location, event_name, event_date, event_time, number_of_registrations, description) VALUES ("tuv", "wxy", "13-11-2025", "10:00PM", 3000, "zab");
      INSERT INTO created_events (event_location, event_name, event_date, event_time, number_of_registrations, description) VALUES ("cde", "fgh", "12-11-2025", "11:00PM", 4000, "ijk");


      CREATE TABLE funds_allocation (
        id_NGO INTEGER,
        id_carehome INTEGER,
        fundraiser_name TEXT,
        description TEXT,
        funds_allocated TEXT
      );`,
      (err) => {
        if (err) {
          console.error("Error creating tables:", err.message);
        } else {
          console.log("All tables created successfully!");
        }
      }
    );
  }
});

module.exports = db;
