const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const authenticate = require("../middlewares/auth.middleware");
const validateSignup = require("../middlewares/validateSignup"); // ✅ add this
const validateLogin = require("../middlewares/validateLogin"); // add this

router.post("/api/login", validateLogin, authController.login); // add validateLogin
router.post("/api/signup", validateSignup, authController.signup); // ✅ add validateSignup

router.post("/api/login", authController.login);

router.post("/api/verify-otp", authController.verifyOTP);

router.post("/api/forgot-password", authController.forgotPassword);

router.post("/api/logout", authController.logout);

router.get("/api/me", authenticate, authController.checkAuth);

module.exports = router;