const path = require("path");
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("./data/database.js");
require("dotenv").config();

const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/";

    if (req.body.userRole == "Carehome") {
      folder += "Carehomes";
    } else if (req.body.userRole == "NGO") {
      if (req.body.type === "event") {
        folder += "Events";
      } else if (req.body.type === "fundraiser") {
        folder += "Fundraisers";
      }
    }

    cb(null, path.join(__dirname, "public", folder));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

module.exports = upload;

const baseRoutes = require("./routes/base.routes.js");
const authRoutes = require("./routes/auth.routes.js");
const carehomeRoutes = require("./routes/carehomes.routes.js");
const donorRoutes = require("./routes/donors.routes.js");
const NGORoutes = require("./routes/NGO.routes.js");
const adminRoutes = require("./routes/admin.routes.js");

app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use(baseRoutes);
app.use(authRoutes);
app.use(carehomeRoutes);
app.use(donorRoutes);
app.use(NGORoutes);
app.use(adminRoutes);

app.listen(3000, () => console.log("Server running on port 3000"));
