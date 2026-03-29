// routes/corporate.routes.js
const express = require("express");
const router = express.Router();

const corporateController = require("../controllers/corporate.controller");

router.post("/api/b2b/corporate/donate", corporateController.bulkDonate);

module.exports = router;