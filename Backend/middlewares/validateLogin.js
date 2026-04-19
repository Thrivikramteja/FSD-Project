const { body, validationResult } = require("express-validator");

const validateLogin = [
  body("userRole").notEmpty().withMessage("User role is required"),
  body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email format"),
  body("password").notEmpty().withMessage("Password is required"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

module.exports = validateLogin;