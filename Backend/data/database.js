const mongoose = require("mongoose");


const dbPath = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/FSDProject";

const db = mongoose.connect(dbPath)
  .then(() => console.log("Successfully connected to Database"))
  .catch((err) => console.error("Database connection error:", err));

module.exports = { db };