const express = require("express");

const router = express.Router();

const NGOController = require("../controllers/NGO.controller");

// router.get('/discoverNgos', NGOController.getNGOs);

router.get('/registerNgo', NGOController.register);

module.exports = router;