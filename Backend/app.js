const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const rfs = require("rotating-file-stream");
const fs = require("fs"); 
const swaggerUi = require("swagger-ui-express"); 
require("./data/database.js");
require("dotenv").config();

const http = require('http');
const { Server } = require('socket.io');

const accessLogStream = rfs.createStream("access.log", {
  interval: "1d",
  path: path.join(__dirname, "accessLogs"),
});

const errorLogStream = rfs.createStream("error.log", {
  interval: "1d",
  path: path.join(__dirname, "errorLogs"),
});

const app = express();
const server = http.createServer(app);

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

// --- UPDATED CORS FOR EXPRESS ---
app.use(cors({ 
  origin: function (origin, callback) {
    // Allow no origin (same-origin requests)
    if (!origin) return callback(null, true);
    
    // Allow Render Frontend, localhost, and any .onrender.com domain
    if (
      origin === "https://fsd-project-frontend.onrender.com" || 
      origin.includes("onrender.com") ||
      origin.startsWith('http://localhost:')
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true 
}));

// Routes
const baseRoutes = require("./routes/base.routes.js");
const authRoutes = require("./routes/auth.routes.js");
const carehomeRoutes = require("./routes/carehomes.routes.js");
const donorRoutes = require("./routes/donors.routes.js");
const NGORoutes = require("./routes/NGO.routes.js");
const adminRoutes = require("./routes/admin.routes.js");
const impactStoriesRoutes = require("./routes/impactStories.routes.js");
const notificationRoutes = require('./routes/notification.routes.js');

app.use(require("./routes/corporate.routes"));
app.use(baseRoutes);
app.use(authRoutes);
app.use(carehomeRoutes);
app.use(donorRoutes);
app.use(NGORoutes);
app.use(adminRoutes);
app.use(impactStoriesRoutes);
app.use(notificationRoutes);

// --- SWAGGER SETUP ---
try {
  const openApiSelector = path.join(__dirname, "docs", "openapi.json");
  const swaggerDoc = JSON.parse(fs.readFileSync(openApiSelector, "utf8"));
  
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

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));
  if (process.env.NODE_ENV !== 'test') {
    console.log("✅ Swagger UI mounted at http://localhost:3000/api-docs");
  }

} catch (err) {
  console.error("❌ Critical Swagger Setup Error:", err.message);
}

// 404 Catch-all
app.use((req, res, next) => {
  const err = new Error("Route not found");
  err.statusCode = 404;
  next(err);
});

// Global ERROR handler
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR ${status}]:`, message);
  }

  res.status(status).json({
    success: false,
    message
  });
});

// --- UPDATED CORS FOR SOCKET.IO ---
const io = new Server(server, {
    cors: {
        origin: function(origin) {
            if (!origin) return true;
            if (
              origin === "https://fsd-project-frontend.onrender.com" || 
              origin.startsWith('http://localhost:')
            ) {
              return true;
            }
            return false;
        },
        credentials: true
    }
});

app.set('io', io);

io.on('connection', (socket) => {
    socket.on('join', ({ userId, role }) => {
        socket.join(`user_${role}_${userId}`);
    });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = { app, server, io };