const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const rfs = require("rotating-file-stream");
//mail errors to the team
const sendErrorEmail = require("./services/errorMailer.js");
require("./data/database.js");
require("dotenv").config();

const accessLogStream = rfs.createStream("access.log", {
  interval: "1d",
  path: path.join(__dirname, "accessLogs"),
});

const errorLogStream = rfs.createStream("error.log", {
  interval: "1d",
  path: path.join(__dirname, "errorLogs"),
});

const app = express();

app.use(morgan("combined", { stream: accessLogStream }));
app.use(
  morgan("combined", {
    stream: errorLogStream,
    skip: (req, res) => res.statusCode < 400,
}));

app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

const baseRoutes = require("./routes/base.routes.js");
const authRoutes = require("./routes/auth.routes.js");
const carehomeRoutes = require("./routes/carehomes.routes.js");
const donorRoutes = require("./routes/donors.routes.js");
const NGORoutes = require("./routes/NGO.routes.js");
const adminRoutes = require("./routes/admin.routes.js");

app.use(baseRoutes);
app.use(authRoutes);
app.use(carehomeRoutes);
app.use(donorRoutes);
app.use(NGORoutes);
app.use(adminRoutes);

// 404 Catch-all
app.use((req, res, next) => {
  const err = new Error("Route not found");
  err.statusCode = 404;
  next(err);
});

//global ERROR handler
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[ERROR ${status}]:`, message);

  sendErrorEmail({
    message,
    stack: err.stack,
    route: req.originalUrl,
    method: req.method
  });

  res.status(status).json({
    success: false,
    message
  });
});


app.listen(3000, () => console.log("Server running on port 3000"));