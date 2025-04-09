const express = require("express"); 

const router = express.Router();

const NGOController = require("../controllers/NGO.controller");

const {isAuth} = require('../controllers/auth.controller');

router.get('/registerNgo', NGOController.getRegister);

router.post('/registerNgo', NGOController.register);

router.get('/events', NGOController.getEvents);

router.get('/fundraisers', NGOController.getFundraisers);

router.get('/NGO-dashboard/:ngoID', isAuth, NGOController.getNGO);

router.get('/NGO-dashboard/:ngoID/create-event',isAuth, NGOController.renderCreateEventForm);

router.post('/NGO-dashboard/:ngoID/create-event',isAuth, NGOController.createEvent);

router.get('/NGO-dashboard/:ngoID/create-fundraiser', isAuth, NGOController.rendercreatefundraiser);

router.post('/NGO-dashboard/:ngoID/create-fundraiser',isAuth ,NGOController.createFundraiser);

router.get('/NGO-dashboard/:ngoID/edit', isAuth, NGOController.getEditNGOProfile);

router.post('/NGO-dashboard/:ngoID/edit', isAuth, NGOController.editNGOProfile);

router.get('/NGOs',NGOController.get_allngo);

router.get('/NGO-dashboard/:ngoID/edit-event',NGOController.renderEditEvent);

router.post('/NGO-dashboard/:ngoID/edit-event',NGOController.editEvent);

module.exports = router;