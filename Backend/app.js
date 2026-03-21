const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const rfs = require("rotating-file-stream");
const fs = require("fs"); 
const swaggerUi = require("swagger-ui-express"); 
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
app.use(cors({ 
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.startsWith('http://localhost:')) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true 
}));

const baseRoutes = require("./routes/base.routes.js");
const authRoutes = require("./routes/auth.routes.js");
const carehomeRoutes = require("./routes/carehomes.routes.js");
const donorRoutes = require("./routes/donors.routes.js");
const NGORoutes = require("./routes/NGO.routes.js");
const adminRoutes = require("./routes/admin.routes.js");
const impactStoriesRoutes = require("./routes/impactStories.routes.js");

app.use(baseRoutes);
app.use(authRoutes);
app.use(carehomeRoutes);
app.use(donorRoutes);
app.use(NGORoutes);
app.use(adminRoutes);
app.use(impactStoriesRoutes);

// --- SWAGGER SETUP START ---
try {
  const openApiSelector = path.join(__dirname, "docs", "openapi.json");
  const swaggerDoc = JSON.parse(fs.readFileSync(openApiSelector, "utf8"));
  
  // Reset paths and schemas to ensure no circular refs from openapi.json
  swaggerDoc.paths = {};
  swaggerDoc.components.schemas = {};

  const mergeDocs = (folderName) => {
    const fullPath = path.join(__dirname, "docs", folderName);
    if (!fs.existsSync(fullPath)) return;

    fs.readdirSync(fullPath).forEach(file => {
      const filePath = path.join(fullPath, file);
      const rawData = fs.readFileSync(filePath, "utf8").trim();

      if (!rawData || rawData === "{}" || rawData === "") return;

      try {
        const content = JSON.parse(rawData);
        if (folderName === "schemas") {
          Object.assign(swaggerDoc.components.schemas, content);
        } else {
          Object.assign(swaggerDoc.paths, content);
        }
      } catch (e) {
        console.error(`[Swagger Error]: JSON issue in ${file}`);
      }
    });
  };

  mergeDocs("paths");
  mergeDocs("schemas");

  // This line serves the UI
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));
  console.log("✅ Swagger UI mounted at http://localhost:3000/api-docs");

} catch (err) {
  console.error("❌ Critical Swagger Setup Error:", err.message);
}
// --- SWAGGER SETUP END ---


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