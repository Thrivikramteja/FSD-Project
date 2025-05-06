const express = require("express");

const donorsController = require("../controllers/donors.controller"); 

const {isAuth} = require('../controllers/auth.controller');

const router = express.Router(); 

router.get('/user-dashboard/:userId',isAuth ,donorsController.getdonor);

router.get('/user-dashboard/:userId/edit', isAuth, donorsController.getEditDonorProfile);

router.put('/user-dashboard/:userId/edit', isAuth, donorsController.editDonorProfile);

router.post('/donate_money/:ngoId/:fundraiser_name', isAuth,donorsController.contributed_fund);

module.exports = router;