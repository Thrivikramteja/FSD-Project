const express = require("express");

const carehomesController = require("../controllers/carehome.controller");
const upload = require("../app");

const { isAuth } = require("../controllers/auth.controller");

const router = express.Router();

router.get('/carehome-dashboard/get-job', isAuth, carehomesController.get_createjob);

router.post('/carehome-dashboard/post-job', isAuth, carehomesController.post_createjob);

router.get('/carehome-dashboard/:carehomeId', isAuth, carehomesController.getCarehome);

router.get('/carehome-dashboard/:carehomeId/edit', isAuth, carehomesController.getEditCarehomeProfile);

router.post('/carehome-dashboard/:carehomeId/edit', isAuth, carehomesController.editCarehomeProfile);

router.get('/donate_money', isAuth, carehomesController.donateMoney);

router.post('/donate_money/:carehomeId', isAuth, carehomesController.insertMoney);

router.get('/donate_items', isAuth, carehomesController.donateItems);

router.post('/donate_items_user', carehomesController.get_don_items);

router.get('/registerCarehome', carehomesController.register);

router.post('/registerCarehome', upload.single("image"), carehomesController.registerCarehome);

router.get('/carehomes', carehomesController.getallcarehomes);

router.get('/api/carehomes', carehomesController.getCareHomesApi);

router.get("/profile/Carehome/:carehomeId", isAuth, carehomesController.getCarehome);

router.get("/carehomes/viewcare/:careid", carehomesController.view_details_care);

router.post('/donate_item/action', carehomesController.accpet_item_doantions);

router.get('/jobs/all', carehomesController.get_alljobs);
router.get('/api/jobs/all', carehomesController.get_alljobs);

router.get('/jobs', carehomesController.job_render);

router.get('/jobs/apply/:jobId', carehomesController.apply_job);

module.exports = router;
