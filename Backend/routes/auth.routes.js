const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const authenticate = require("../middlewares/auth.middleware");

router.post("/api/signup", authController.signup);
router.post("/api/login", authController.login);
router.post("/api/logout", authController.logout);

router.get("/api/me", authenticate, authController.checkAuth);

module.exports = router;
