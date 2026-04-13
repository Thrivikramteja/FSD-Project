const express = require("express");
const router = express.Router();

const NGOController = require("../controllers/NGO.controller");
const upload = require("../multerConfig");

const authenticate = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");

const { Carehome } = require("../models/carehome.model");

router.post("/api/ngo/register", NGOController.register);

router.get("/fundraisers", NGOController.getallFundraisers);

router.get(
  "/api/ngo-dashboard/:ngoID",
  authenticate,
  authorizeRoles("NGO"),
  NGOController.getNGO
);

router.post(
  "/api/ngo-dashboard/:ngoID/create-fundraiser",
  authenticate,
  authorizeRoles("NGO"),
  upload.single("image"),
  NGOController.createFundraiser
);

router.post(
  "/api/ngo/:ngoID/create-event",
  authenticate,
  authorizeRoles("NGO"),
  upload.single("image"),
  NGOController.createEvent
);

router.get("/api/ngos", NGOController.get_allngo);

router.get("/api/carehomes-list", async (req, res) => {
  try {
    const carehomes = await Carehome.find({}, "carehomeId care_home_name");
    res.json(carehomes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch carehomes" });
  }
});

router.get(
  "/api/NGO-dashboard/:ngoID/details",
  authenticate,
  authorizeRoles("NGO"),
  NGOController.getEditNGOProfile
);

router.get(
  "/api/NGO-dashboard/:ngoID/details/:type/:id",
  authenticate,
  authorizeRoles("NGO"),
  NGOController.getCampaignDetails
);

router.put(
  "/api/NGO-dashboard/:ngoID/edit",
  authenticate,
  authorizeRoles("NGO"),
  NGOController.editNGOProfile
);

router.get("/api/events", NGOController.getEvents);

router.post(
  "/registerUser/:ngoID",
  authenticate,
  authorizeRoles("Donor"),
  NGOController.registerUser
);

router.get("/api/NGOs/profile/:id", NGOController.getNGOProfileDetails);

module.exports = router;
