const express = require("express");

const baseController = require("../controllers/base.controller");

const router = express.Router();

router.get("/", baseController.getLandingPage);

// router.get("/donate_money", (req, res) => {
//   res.render("carehomes/donate_money");
// });

// router.get("/discover_events", (req, res) => {
//   res.render("");
// });

module.exports = router;
