const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, "public"))); // Serve static files
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.get("/donate", (req, res) => {
    res.render("donate"); // Renders donate.ejs
});

// Correctly serve donate_money.html
app.get("/donate_money", (req, res) => {
    res.sendFile(path.resolve(__dirname, "public", "donate_money.html"));
});

app.post("/donate", (req, res) => {
    const { name, phone, email, pan } = req.body;
    
    if (!name || !phone || !email || !pan) {
        return res.status(400).send("All fields are required!");
    }
    
    console.log("Donation details:", req.body);
    
    res.send("Donation successful! Thank you for your support.");
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
