const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Dummy events data
const events = [
    {
        image: "/images/blooddonation.png",
        title: "Blood Donation Drive",
        description: "Organized events where volunteers donate blood to help patients in need."
    },
    {
        image: "/images/treeplantation.png",
        title: "Tree Plantation Drive",
        description: "Organized efforts to plant trees and promote environmental sustainability."
    },
    {
        image: "/images/clothesdrives.png",
        title: "Clothes & Blanket Drive",
        description: "Collecting and distributing warm clothing to those in need."
    },
    {
        image: "/images/health.png",
        title: "Health Awareness Camp",
        description: "Medical check-ups and education on healthy living."
    },
    {
        image: "/images/development.png",
        title: "Skill Development Workshop",
        description: "Providing vocational training for unemployed youth and underprivileged communities."
    },
    {
        image: "/images/seniorhelp.png",
        title: "Senior Citizen Support Program",
        description: "Donating time, resources, and care packages to old-age homes."
    }
];

// Set up Express to use EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Route to render events page
app.get("/events", (req, res) => {
    res.render("events", { events });
});

// Route to render donor registration page
app.get("/donor_reg", (req, res) => {
    const { event } = req.query;
    res.render("donor_reg", { 
        name: "", 
        email: "", 
        number: "", 
        age: "", 
        address: "", 
        state: "", 
        states: ["Andhra Pradesh", "Telangana", "Karnataka", "Tamil Nadu", "Maharashtra"],
        event: event || "General Donation"
    });
});

// Handle form submission
app.post("/register", (req, res) => {
    const { name, email, number, age, address, state, event } = req.body;
    console.log("New Donor Registered:", { name, email, number, age, address, state, event });

    res.send(`<h2>Thank you, ${name}, for registering for ${event}!</h2>`);
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running at: http://localhost:${PORT}/events`);
});
