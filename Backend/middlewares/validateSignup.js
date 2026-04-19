const { body, validationResult } = require("express-validator");

const validateSignup = [
  body("fullname")
    .notEmpty().withMessage("Name is required")
    .isLength({ max: 255 }).withMessage("Name too long"),

  body("mail")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format"),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

module.exports = validateSignup;