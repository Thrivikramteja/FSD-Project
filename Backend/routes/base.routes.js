const express = require("express");
const router = express.Router();

const baseController = require("../controllers/base.controller");

router.get("/api", baseController.getLandingPage);

module.exports = router;
