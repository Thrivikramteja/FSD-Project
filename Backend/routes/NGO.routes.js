const express = require("express");

const router = express.Router();

const NGOController = require("../controllers/NGO.controller");
const upload = require("../app");

const { isAuth } = require('../controllers/auth.controller');

const { Carehome } = require("../models/carehome.model");

router.get("/profile/NGO/:ngoID", isAuth, NGOController.getNGO);

router.get('/registerNgo', NGOController.getRegister);

router.post('/registerNgo', NGOController.register);

router.get('/events', NGOController.getEvents);

router.get('/registerUser/:ngoID/:eventName', isAuth, NGOController.getRegisterUser);

router.post('/registerUser/:ngoID', isAuth, NGOController.registerUser);

router.get('/fundraisers', NGOController.getallFundraisers);

router.get('/NGO-dashboard/:ngoID', isAuth, NGOController.getNGO);

router.get('/api/ngo-dashboard/:ngoID', NGOController.getNGO);

//
router.get('/api/carehomes-list', async (req, res) => {
  try {
    
    const carehomes = await Carehome.find({}, 'carehomeId care_home_name');
    res.json(carehomes);
  } catch (error) {
    console.error("Error fetching carehomes list:", error);
    res.status(500).json({ error: "Failed to fetch carehomes" });
  }
});
//

router.get('/NGO-dashboard/:ngoID/create-event', isAuth, NGOController.renderCreateEventForm);

router.post('/NGO-dashboard/:ngoID/create-event', upload.single("image"), NGOController.createEvent);

router.get('/NGO-dashboard/:ngoID/create-fundraiser', isAuth, NGOController.rendercreatefundraiser);

router.post('/NGO-dashboard/:ngoID/create-fundraiser', isAuth, upload.single("image"), NGOController.createFundraiser);

router.get('/NGO-dashboard/:ngoID/edit', isAuth, NGOController.getEditNGOProfile);

router.post('/NGO-dashboard/:ngoID/edit', isAuth, NGOController.editNGOProfile);

router.get('/NGOs', NGOController.get_allngo);

exports.get_allngo = async (req, res) => {
    try {
        const ngos = await NGO.find(); // Fetch data from DB
        
        // Send raw JSON data to React
        res.json(ngos); 
    } catch (error) {
        console.log("Error fetching NGOs:", error);
        res.status(500).json({ message: "Failed to fetch NGOs" });
    }
};
router.get('/NGO-dashboard/:ngoID/edit-event', NGOController.renderEditEvent);

router.post('/NGO-dashboard/:ngoID/edit-event', NGOController.editEvent);

router.get('/donate_fundraiser/:ngoId/:fundraiser_name', NGOController.render_donate_fundraiser);

module.exports = router;