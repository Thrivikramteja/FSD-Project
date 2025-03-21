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
        mobile_number TEXT
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

      CREATE TABLE created_events (
        id_NGO INTEGER,
        event_location TEXT,
        event_name TEXT,
        event_date TEXT,
        event_time TEXT,
        number_of_registrations INTEGER,
        description TEXT
      );

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
