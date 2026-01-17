const express = require("express");
const router = express.Router();

const donorsController = require("../controllers/donors.controller");

const applicationcontroller = require('../controllers/application.controller');

const authenticate = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");

router.get(
  "/api/donor/dashboard/:userId",
  authenticate,
  authorizeRoles("Donor"),
  donorsController.getdonor
);

router.put(
  "/api/donor/:userId",
  authenticate,
  authorizeRoles("Donor"),
  donorsController.editDonorProfile
);

router.post(
  "/api/donate/:ngoId/:fundraiser_name",
  authenticate,
  authorizeRoles("Donor"),
  donorsController.contributed_fund
);

router.post("/api/applications/apply",applicationcontroller.applyToJob);

router.get(
  "/api/activity/:userId",
  authenticate,
  authorizeRoles("Donor"),
  donorsController.getUserActivity
);

module.exports = router;
