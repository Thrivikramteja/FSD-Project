const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const rfs = require("rotating-file-stream");
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

// 404 Catch-all (for routes that don't exist on the server)
app.use((req, res, next) => {
    const err = new Error("Page Not Found");
    err.statusCode = 404;
    next(err); 
});

// Global Error Handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "An unexpected error occurred.";

    console.error(`[ERROR ${statusCode}]: ${message}`);

    if (res.headersSent) {
        return next(err);
    }

    const wantsJson = req.xhr || 
                      req.path.startsWith('/api') || 
                      (req.headers.accept && req.headers.accept.includes('json'));

    if (wantsJson) {
        return res.status(statusCode).json({
            success: false,
            message: message
        });
    }

    // HTML Cute Face Fallback
    res.status(statusCode).send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Oops! - CareConnect</title>
        <link href="https://fonts.googleapis.com/css?family=Open+Sans:400,800" rel="stylesheet">
        <style>
            body { margin: 0; padding: 0; width: 100%; min-height: 100vh; background-color: #F2EEE8; font-family: 'Open Sans'; text-align: center; }
            .face { width: 300px; height: 300px; border: 4px solid #383A41; border-radius: 10px; background-color: #FFFFFF; margin: 100px auto 0; position: relative; }
            .band { width: 350px; height: 27px; border: 4px solid #383A41; border-radius: 5px; margin-left: -25px; margin-top: 50px; position: relative; }
            .band .red { height: 33.3%; width: 100%; background-color: #EB6D6D; }
            .band .white { height: 33.3%; width: 100%; background-color: #FFFFFF; }
            .band .blue { height: 33.3%; width: 100%; background-color: #5E7FDC; }
            .band:before { content: ""; display: inline-block; height: 27px; width: 30px; background-color: rgba(255,255,255,0.3); position: absolute; z-index: 9; left: 0; }
            .band:after { content: ""; display: inline-block; height: 27px; width: 30px; background-color: rgba(56,58,65,0.3); position: absolute; z-index: 9; right: 0; top: 0; }
            .eyes { width: 128px; margin: 40px auto 0; }
            .eyes:before, .eyes:after { content: ""; display: inline-block; width: 30px; height: 15px; border: 7px solid #383A41; border-top-left-radius: 22px; border-top-right-radius: 22px; border-bottom: 0; }
            .eyes:before { margin-right: 20px; }
            .eyes:after { margin-left: 20px; }
            .dimples { width: 180px; margin: 15px auto 0; }
            .dimples:before, .dimples:after { content: ""; display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: rgba(235,109,109,0.4); }
            .dimples:before { margin-right: 40px; }
            .dimples:after { margin-left: 40px; }
            .mouth { width: 40px; height: 5px; border-radius: 5px; background-color: #383A41; margin: 25px auto 0; }
            h1 { font-weight: 800; color: #383A41; font-size: 2.5em; padding-top: 20px; }
            .btn { display: inline-block; padding: 20px; background-color: #5E7FDC; color: white; width: 320px; margin: 80px auto 50px; text-decoration: none; border-radius: 5px; transition: all .2s linear; cursor: pointer; border: none; font-size: 1.1em; }
            .btn:hover { background-color: rgba(94,127,220, 0.8); }
            .mail-notice { color: #5E7FDC; font-weight: bold; margin-top: 10px; }
        </style>
    </head>
    <body>
        <div class="face">
            <div class="band"><div class="red"></div><div class="white"></div><div class="blue"></div></div>
            <div class="eyes"></div>
            <div class="dimples"></div>
            <div class="mouth"></div>
        </div>
        <h1>Oops! Something went wrong!</h1>
        <p class="mail-notice">${message}</p>
        <button class="btn" onclick="window.location.href='http://localhost:5173/'">Return to Home</button>

        <script>
            setTimeout(function() {
                window.location.href = "http://localhost:5173/";
            }, 5000);
        </script>
    </body>
    </html>
    `);
});

app.listen(3000, () => console.log("Server running on port 3000"));