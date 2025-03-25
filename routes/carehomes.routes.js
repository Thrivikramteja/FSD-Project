const express = require("express");

const carehomesController = require("../controllers/carehome.controller");

const router = express.Router();

// router.get('/carehome-dashboard/:carehomeId', carehomesController.getCarehome);

router.get('/donate_money', carehomesController.donateMoney);

router.get('/registerCarehome', carehomesController.register);

module.exports = router;    