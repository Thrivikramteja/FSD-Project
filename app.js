const path = require("path");

const express = require("express");

const baseRoutes = require("./routes/base.routes");
const authRoutes = require("./routes/auth.routes.js");

const app = express();

app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(baseRoutes);
app.use(authRoutes);

app.listen(3000, () => console.log("Server running on port 3000"));
