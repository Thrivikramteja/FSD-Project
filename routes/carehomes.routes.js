const express = require("express");

const carehomesController = require("../controllers/carehome.controller");

const { isAuth }  = require("../controllers/auth.controller");

const router = express.Router();

router.get('/carehome-dashboard/:carehomeId',isAuth, carehomesController.getCarehome);

router.get('/carehome-dashboard/:carehomeId/edit', isAuth, carehomesController.getEditCarehomeProfile);

router.put('/carehome-dashboard/:carehomeId/edit', isAuth, carehomesController.editCarehomeProfile);

router.get('/donate_money', carehomesController.donateMoney);

router.get('/donate_items', carehomesController.donateItems);

router.get('/registerCarehome', carehomesController.register);

router.post('/registerCarehome', carehomesController.registerCarehome);

router.get('/carehomes',carehomesController.getallcarehomes);

router.get("/carehomes/viewcare/:careid",carehomesController.view_details_care);

module.exports = router;