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

module.exports = router;
