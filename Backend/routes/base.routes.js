const express = require("express");

const baseController = require("../controllers/base.controller");

const router = express.Router();

router.get("/api", baseController.getLandingPage);

module.exports = router;
