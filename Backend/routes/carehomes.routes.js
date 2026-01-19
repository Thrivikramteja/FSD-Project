const express = require("express");
const router = express.Router();

const carehomesController = require("../controllers/carehome.controller");
const upload = require("../multerConfig");

const authenticate = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");

router.get(
  "/api/carehome-dashboard/:carehomeId",
  authenticate,
  authorizeRoles("Carehome"),
  carehomesController.getCarehome
);

router.put(
  "/api/carehome/:carehomeId",
  authenticate,
  authorizeRoles("Carehome"),
  carehomesController.editCarehomeProfile
);

router.post(
  "/api/carehome/:carehomeId/donate-money",
  authenticate,
  authorizeRoles("Donor"),
  carehomesController.insertMoney
);

router.get("/api/carehomes", carehomesController.getCareHomesApi);
router.get("/api/jobs", carehomesController.get_alljobs);

router.post(
  "/api/registerCarehome",
  upload.single("image"),
  carehomesController.registerCarehome
);

router.post('/carehome-dashboard/post-job', carehomesController.post_createjob);

router.post('/donate_items_user',  authenticate,
  authorizeRoles("Donor"), carehomesController.get_don_items);

 router.post('/donate_item/action',authenticate,
  authorizeRoles("Carehome"), carehomesController.accpet_item_doantions);

module.exports = router;
