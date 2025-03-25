const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files (CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// List of states
const statesList = [
    "Andhra Pradesh", "Telangana", "Karnataka", "Tamil Nadu", "Kerala",
    "Maharashtra", "West Bengal", "Uttar Pradesh", "Madhya Pradesh", "Gujarat",
    "Rajasthan", "Punjab", "Haryana", "Bihar", "Odisha", "Chhattisgarh",
    "Jharkhand", "Assam", "Uttarakhand", "Goa", "Delhi"
];

// Redirect to registration page
app.get("/", (req, res) => {
    res.redirect("/register");
});

// Serve donor registration page with default values
app.get("/register", (req, res) => {
    res.render("donor_reg", {
        name: "",
        email: "",
        number: "",
        age: "",
        state: "",
        terms: false,
        states: statesList,
        event: "Blood Donation Camp" // ✅ Added a default event name
    });
});

// Handle donor registration form submission
app.post("/register", (req, res) => {
    try {
        const { name, email, number, age, state, terms, address, event } = req.body;

        // Check for missing fields
        if (!name || !email || !number || !age || !state || !terms || !address || !event) {
            return res.status(400).json({ message: "⚠️ All fields are required." });
        }

        // Validate phone number
        if (!/^\d{10}$/.test(number)) {
            return res.status(400).json({ message: "⚠️ Phone number must be exactly 10 digits." });
        }

        // Validate age
        if (age < 18) {
            return res.status(400).json({ message: "⚠️ You must be at least 18 years old to donate." });
        }

        console.log("✅ New Donor Registered:", req.body);
        res.status(201).json({ message: "🎉 Donor registered successfully!" });

    } catch (error) {
        console.error("❌ Server Error:", error.message);
        res.status(500).json({ message: "🚨 Internal Server Error. Please try again later." });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running at: http://localhost:${PORT}/register`);
});
