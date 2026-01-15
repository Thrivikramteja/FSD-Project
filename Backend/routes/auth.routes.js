const express = require("express");
const authController = require("../controllers/auth.controller");

const router = express.Router();

router.post("/api/signup", authController.signup);

router.post("/api/login", authController.login);

// --- THE NEW VERIFICATION ROUTE ---
router.post("/api/verify-otp", authController.verifyOTP);

router.get("/api/check-session", authController.checkSession);

router.post("/api/logout", authController.logout);

router.post("/api/forgot-password",authController.forgotPassword);

module.exports = router;