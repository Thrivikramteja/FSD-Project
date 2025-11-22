const path = require("path");

const express = require("express");
const session = require("express-session");
const multer = require('multer');
const cors = require("cors");
require('dotenv').config();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/"

    if (req.body.userRole == "Carehome") {
      folder += "Carehomes"
    } else if (req.body.userRole == "NGO") {
      if (req.body.type === "event") {
        folder += "Events"
      } else if (req.body.type === "fundraiser") {
        folder += "Fundraisers"
      }
    }

    cb(null, path.join(__dirname, "public", folder));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`)
  }
});

const upload = multer({ storage });

module.exports = upload;

require("./data/database.js");

const baseRoutes = require("./routes/base.routes.js");
const authRoutes = require("./routes/auth.routes.js");
const carehomeRoutes = require("./routes/carehomes.routes.js");
const donorRoutes = require("./routes/donors.routes.js");
const NGORoutes = require("./routes/NGO.routes.js");
const adminRoutes = require('./routes/admin.routes.js');

const app = express();

app.use(session({
  // Add the || operator to provide a default key for development
  secret: process.env.SECRET_KEY || "dev_secret_key_123", 
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    secure: false
  }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.get("/api/check-session", (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, role: req.session.user.role });
  } else {
    res.json({ loggedIn: false });
  }
});

app.use(baseRoutes);
app.use(authRoutes);
app.use(carehomeRoutes);
app.use(donorRoutes);
app.use(NGORoutes);
app.use(adminRoutes);


app.listen(3000, () => console.log("Server running on port 3000"));