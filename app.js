const path = require("path");

const express = require("express");
const session = require("express-session");

require("./data/database.js");

// require("./data/sqlite3");
// const SQLiteStore = require("connect-sqlite3")(session);

const baseRoutes = require("./routes/base.routes.js");
const authRoutes = require("./routes/auth.routes.js");
const carehomeRoutes = require("./routes/carehomes.routes.js");
const donorRoutes = require("./routes/donors.routes.js");
const NGORoutes = require("./routes/NGO.routes.js");

const app = express();

// app.use(
//   session({
//     store: new SQLiteStore({
//       db: "sessions.db",
//       dir: "./data",
//     }),
//     secret: "the-very-very-strongest-secret-key",
//     resave: false,
//     saveUninitialized: false,
//     cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
//   })
// );

app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// const isAuth = (req, res, next) => {
//   if (req.session.isAuth) {
//     next();
//   } else {
//     res.redirect("/login");
//   }
// };

app.use(baseRoutes);
app.use(authRoutes);
app.use(carehomeRoutes);
app.use(donorRoutes);
app.use(NGORoutes);

app.listen(3000, () => console.log("Server running on port 3000"));

