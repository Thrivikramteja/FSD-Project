const express = require("express");

const router = express.Router();

const admin_con = require('../controllers/admin.controller');

const {isAuth} = require('../controllers/auth.controller');

router.get('/admin-dashboard', isAuth, admin_con.Getadmin);

module.exports = router;