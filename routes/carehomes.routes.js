const express = require("express");

const carehomesController = require("../controllers/carehome.controller");

const { isAuth }  = require("../controllers/auth.controller");

const router = express.Router();

router.get('/carehome-dashboard/:carehomeId',isAuth, carehomesController.getCarehome);

router.get('/carehome-dashboard/:carehomeId/edit', isAuth, carehomesController.getEditCarehomeProfile);

router.post('/carehome-dashboard/:carehomeId/edit', isAuth, carehomesController.editCarehomeProfile);

router.get('/donate_money',isAuth, carehomesController.donateMoney);

router.post('/donate_money/:carehomeId',isAuth, carehomesController.insertMoney);

router.get('/donate_items', carehomesController.donateItems);

router.get('/registerCarehome', carehomesController.register);

router.post('/registerCarehome', carehomesController.registerCarehome);

router.get('/carehomes',carehomesController.getallcarehomes);

router.get("/profile/Carehome/:carehomeId", isAuth, carehomesController.getCarehome);

router.get("/carehomes/viewcare/:careid",carehomesController.view_details_care);

module.exports = router;