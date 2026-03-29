const express = require("express");
const router = express.Router();

const admin_con = require("../controllers/admin.controller");
const authenticate = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");

router.get(
  "/api/admin/dashboard",
  authenticate,
  authorizeRoles("Admin"),
  admin_con.Getadmin
);

router.get('/api/admin/main-stats', admin_con.Getadmin);

router.get('/api/admin/events-analytics',  authenticate,
  authorizeRoles("Admin"), admin_con.getAdminEventAnalytics);

router.get('/api/admin/fundraisers-analytics',  authenticate,
  authorizeRoles("Admin"),admin_con. getAdminFundraiserAnalytics);

router.get('/api/admin/fundraiser-donors/:fundraiserObjectId',  authenticate,
  authorizeRoles("Admin"),admin_con.getFundraiserDonors);

router.get('/api/admin/donations-analytics',  authenticate,
  authorizeRoles("Admin"),admin_con.getAdminDonationAnalytics);

router.get('/api/admin/carehome-donors/:carehomeId',  authenticate,
  authorizeRoles("Admin"), admin_con.getCarehomeDonors);


router.get('/api/admin/event-registrations/:eventObjectId',authenticate,
  authorizeRoles("Admin"), admin_con.getEventRegistrations);

router.get('/api/admin/all-donors',authenticate,
  authorizeRoles("Admin"), admin_con.getAllDonors);

router.get('/api/admin/donor-stats/:userId',authenticate,
  authorizeRoles("Admin"), admin_con.getDonorManagementStats);

router.delete('/api/admin/delete-donor',authenticate,
  authorizeRoles("Admin"), admin_con.deleteDonorWithEmail);

router.get('/api/admin/all-ngos-manage',authenticate,
  authorizeRoles("Admin"),admin_con.getAllNgoManagement);

router.get('/api/admin/ngo-manage-stats/:ngoId',authenticate,
  authorizeRoles("Admin"), admin_con.getNgoManagementStats);

router.delete('/api/admin/delete-ngo', authenticate,
  authorizeRoles("Admin"), admin_con.deleteNgoWithEmail);

router.get('/api/admin/all-carehomes-manage',authenticate,
  authorizeRoles("Admin"), admin_con.getAllCarehomeManagement);

router.get('/api/admin/carehome-manage-stats/:carehomeId',authenticate,
  authorizeRoles("Admin"), admin_con.getCarehomeManagementStats);
  
router.delete('/api/admin/delete-carehome', authenticate,
  authorizeRoles("Admin"), admin_con.deleteCarehomeWithEmail);

module.exports = router;
