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

// ---------------------------------------------------------------------------
// Routes — all requires at top level to avoid temporal dead-zone issues
// ---------------------------------------------------------------------------
const baseRoutes         = require("./routes/base.routes.js");
const authRoutes         = require("./routes/auth.routes.js");
const carehomeRoutes     = require("./routes/carehomes.routes.js");
const donorRoutes        = require("./routes/donors.routes.js");
const NGORoutes          = require("./routes/NGO.routes.js");
const adminRoutes        = require("./routes/admin.routes.js");
const impactStoriesRoutes = require("./routes/impactStories.routes.js");
const notificationRoutes = require('./routes/notification.routes.js');
// Payment routes — Cashfree integration (feature-flagged)
const paymentRoutes      = require('./routes/payment.routes.js');

// ---------------------------------------------------------------------------
// App + Server
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// 1. CORS Middleware (Mounted first to handle all preflight OPTIONS and API requests)
// ---------------------------------------------------------------------------
const allowedOrigins = [
  "https://fsd-project-frontend.onrender.com",
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // Allow Render Frontend, localhost, and any .onrender.com domain
    if (
      allowedOrigins.includes(origin) ||
      origin === "https://fsd-project-frontend.onrender.com" ||
      origin.includes("onrender.com") ||
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:")
    ) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
};

app.use(cors(corsOptions));

// ---------------------------------------------------------------------------
// 2. Cashfree Webhook Route (Mounted BEFORE global express.json())
// Cashfree HMAC verification requires the raw byte stream (express.raw).
// ---------------------------------------------------------------------------
const { cashfreeWebhook } = require("./controllers/payment.controller");
app.post(
  "/api/payment/cashfree/webhook",
  express.raw({ type: "application/json" }),
  cashfreeWebhook
);

// ---------------------------------------------------------------------------
// 3. Body & Cookie Parsers (For standard JSON, URL-encoded, and cookie requests)
// ---------------------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ---------------------------------------------------------------------------
// 4. API & Payment Routes (Mounted AFTER express.json() and cookieParser())
// ---------------------------------------------------------------------------
app.use(paymentRoutes);
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
// Expose io globally so the webhook controller can send Socket.IO notifications.
// The webhook handler has no access to req.app, so global._ccIO is the bridge.
global._ccIO = io;

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