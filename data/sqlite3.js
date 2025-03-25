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
        mobile TEXT,
        govt_id TEXT,
        bank_acc_holder_name TEXT,
        IFSC_code TEXT,
        bank_acc_number TEXT,
        wishlist TEXT,
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
        id_donor INTEGER,
        amount_donated INTEGER,
        id_carehome INTEGER,
        donated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE donations_items (
        id_donor INTEGER,
        id_carehome INTEGER,
        type_of_item TEXT,
        donated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE user_contributed_fundraisers (
        id_donor INTEGER,
        id_NGO INTEGER,
        fundraiser_name TEXT,
        amount_contributed INTEGER,
        contributed_at TEXT DEFAULT (datetime('now')),
        deadline TEXT
      );

      CREATE TABLE user_registered_events (
        id_donor INTEGER,
        id_NGO INTEGER,
        event_name TEXT,
        event_date TEXT,
        event_time TEXT,
        event_location TEXT
      );

      CREATE TABLE created_fundraisers (
        id_carehome INTEGER,
        fundraiser_name TEXT,
        id_NGO INTEGER,
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
    db.exec(`
      -- Insert sample donors
      INSERT INTO donors (name, email, password, mobile_number)
      VALUES 
          ('Alice', 'alice@example.com', 'password123', '1234567890'),
          ('Bob', 'bob@example.com', 'password123', '0987654321'),
          ('Charlie', 'charlie@example.com', 'password123', '1122334455'),
          ('Diana', 'diana@example.com', 'password123', '6677889900');
  
      -- Insert sample carehomes
      INSERT INTO carehomes (name_carehome, email, password, govt_id, bank_acc_holder_name, IFSC_code, bank_acc_number, state, city, description, number_of_residents, avg_monthly_expenses)
      VALUES 
          ('CareHome A', 'carehomeA@example.com', 'passA', 'GOVT123A', 'Account A', 'IFSC001A', '111122223333', 'State A', 'City A', 'A lovely place', 50, 100000),
          ('CareHome B', 'carehomeB@example.com', 'passB', 'GOVT123B', 'Account B', 'IFSC001B', '222233334444', 'State B', 'City B', 'A caring place', 30, 80000);
  
      -- Insert sample NGOs
      INSERT INTO NGOs (name_NGO, email, password, darpan_id, bank_acc_holder_name, IFSC_code, bank_acc_number, funds_raised, YOE)
      VALUES 
          ('NGO Alpha', 'ngoalpha@example.com', 'alpha123', 'DARPAN001', 'NGO Account A', 'IFSC010A', '333344445555', 500000, 5),
          ('NGO Beta', 'ngobeta@example.com', 'beta123', 'DARPAN002', 'NGO Account B', 'IFSC010B', '444455556666', 300000, 3);
  
      -- Insert donations (money)
      INSERT INTO donations_money (id_donor, amount_donated, id_carehome, donated_at)
      VALUES 
          (1, 5000, 1, '20-03-2025'),
          (2, 3000, 1, '15-03-2025'),
          (3, 2000, 1, '22-03-2025'),
          (4, 4000, 2, '25-03-2025');
  
      -- Insert donations (items)
      INSERT INTO donations_items (id_donor, id_carehome, type_of_item, donated_at)
      VALUES 
          (1, 1, 'Clothes', '10-03-2025'),
          (2, 2, 'Books', '12-03-2025'),
          (3, 1, 'Food', '18-03-2025'),
          (4, 2, 'Toys', '19-03-2025');
  
      -- Insert user contributed fundraisers
      INSERT INTO user_contributed_fundraisers (id_donor, id_NGO, fundraiser_name, amount_contributed, contributed_at, deadline)
      VALUES 
          (1, 1, 'Fundraiser Alpha', 1000, '01-03-2025', '30-03-2025'),
          (2, 1, 'Fundraiser Beta', 2000, '05-03-2025', '29-03-2025'),
          (3, 2, 'Fundraiser Gamma', 1500, '10-03-2025', '20-03-2025'),
          (4, 2, 'Fundraiser Delta', 2500, '15-03-2025', '30-03-2025');
  
      -- Insert user registered events
      INSERT INTO user_registered_events (id_donor, id_NGO, event_name, event_date, event_time, event_location)
      VALUES 
          (1, 1, 'Tree Plantation', '20-03-2025', '10:00 AM', 'Park A'),
          (2, 1, 'Health Checkup', '28-03-2025', '02:00 PM', 'Community Hall B'),
          (3, 2, 'Fundraising Gala', '18-03-2025', '05:00 PM', 'Banquet C'),
          (4, 2, 'Educational Workshop', '25-03-2025', '09:00 AM', 'School D');
  
      -- Insert created fundraisers
      INSERT INTO created_fundraisers (id_carehome, fundraiser_name, has_report, goal_amount, description, amount_raised_so_far, deadline,id_NGO)
      VALUES 
          (1, 'CareHome A Fundraiser', 1, 100000, 'Helping CareHome A', 60000, '30-03-2025',1),
          (1, 'CareHome B Fundraiser', 0, 80000, 'Supporting CareHome B', 40090, '25-03-2025',1),
          (1, 'CareHome c Fundraiser', 1, 100000, 'Helping CareHome A', 60000, '30-03-2025',1),
          (1, 'CareHome d Fundraiser', 0, 80000, 'Supporting CareHome B', 40000, '25-03-2025',1);
  
      -- Insert created events
      INSERT INTO created_events (id_NGO, event_location, event_name, event_date, event_time, number_of_registrations, description)
      VALUES 
          (1, 'Park A', 'Tree Plantation Drive', '29-03-2025', '10:00 AM', 20, 'Planting trees in the park.'),
          (1, 'Community Hall B', 'Health Checkup Camp2', '26-03-2025', '02:00 PM', 15, 'Free health checkup for the needy.'),
          (1, 'Community Hall B', 'Health Checkup Camp1', '27-03-2025', '02:00 PM', 15, 'Free health checkup for the needy.');
  
      -- Insert funds allocation
      INSERT INTO funds_allocation (id_NGO, id_carehome, fundraiser_name, description, funds_allocated)
      VALUES 
          (1, 1, 'Fundraiser Alpha', 'Funds for medical supplies', '25000'),
          (2, 2, 'Fundraiser Gamma', 'Funds for educational supplies', '15000');
  `, (err) => {
      if (err) {
          console.error("Error inserting data:", err.message);
      } else {
          console.log("Sample data inserted successfully!");
      }
  });
  
  }
});

module.exports = db;