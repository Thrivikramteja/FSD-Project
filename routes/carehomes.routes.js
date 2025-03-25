const express = require("express");

const carehomesController = require("../controllers/carehomes.controller");

const router = express.Router();

router.get('/carehome-dashboard/:carehomeId', carehomesController.getCarehome);

module.exports = router;