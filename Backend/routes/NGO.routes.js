const express = require("express");
const router = express.Router();

const NGOController = require("../controllers/NGO.controller");
const upload = require("../multerConfig");

const authenticate = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");

const { Carehome } = require("../models/carehome.model");

router.post("/api/ngo/register", NGOController.register);

router.get(
  "/api/ngo-dashboard/:ngoID",
  authenticate,
  authorizeRoles("NGO"),
  NGOController.getNGO
);

router.post(
  "/api/ngo/:ngoID/events",
  authenticate,
  authorizeRoles("NGO"),
  upload.single("image"),
  NGOController.createEvent
);

router.post(
  "/api/ngo/:ngoID/fundraisers",
  authenticate,
  authorizeRoles("NGO"),
  upload.single("image"),
  NGOController.createFundraiser
);

router.put(
  "/api/ngo/:ngoID",
  authenticate,
  authorizeRoles("NGO"),
  NGOController.editNGOProfile
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

module.exports = router;
