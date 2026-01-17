const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const { User } = require("../models/user.model");
const { NGO } = require("../models/NGO.model");
const { Carehome } = require("../models/carehome.model");

const { generateOTP, sendOTPEmail } = require("../services/otpService");

const isAuth = (req, res, next) => {
  if (req.session.isAuth) return next();

  return res.status(401).json({
    success: false,
    loggedIn: false,
    message: "Not authenticated",
  });
};

async function signup(req, res) {
  const { fullname, mail, password, phone, checkbox } = req.body;

  try {
    const exists = await User.getUserByEmail(mail);
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = new User({
      name: fullname,
      email: mail,
      password: password,
      mobile_number: phone,
      receive_notifications: checkbox === true || checkbox === "on",
    });

    await user.signup();

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

async function login(req, res) {
  const { userRole, email, password } = req.body;

  try {
    let user = null;

    if (userRole === "NGO") {
      user = await NGO.getNGO(email);
    } else if (userRole === "Donor") {
      user = await User.getUserByEmail(email);
    } else if (userRole === "Carehome") {
      user = await Carehome.getCarehome(email);
    } else if (userRole === "Admin") {
      if (email === "fsd@gmail.com" && password === "123456") {
        const token = jwt.sign({ role: "Admin" }, process.env.JWT_SECRET, {
          expiresIn: "1d",
        });

        res.cookie("token", token, {
          httpOnly: true,
          sameSite: "lax",
          secure: false,
        });

        return res.status(200).json({
          success: true,
          role: "Admin",
          redirect: "/admin-dashboard",
        });
      }
      return res
        .status(401)
        .json({ success: false, message: "Invalid admin credentials" });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user role" });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${userRole} does not exist`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    const otp = generateOTP();
    const expires = new Date(Date.now() + 5 * 60000); // Code expires in 5 mins

    user.otpCode = otp;
    user.otpExpires = expires;
    await user.save();

    try {
      await sendOTPEmail(user.email, otp);

      // We do NOT set req.session here. We wait for OTP verification.
      return res.status(200).json({
        success: true,
        twoFactorRequired: true,
        email: user.email,
        role: userRole,
        message: "OTP sent to your email",
      });
    } catch (mailErr) {
      console.error("Mail Error:", mailErr);
      return res
        .status(500)
        .json({ success: false, message: "Failed to send OTP email" });
    }
  } catch (err) {
    console.error("Login error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

async function verifyOTP(req, res) {
  const { email, otp, userRole } = req.body;

  try {
    let user = null;
    if (userRole === "NGO") user = await NGO.getNGO(email);
    else if (userRole === "Donor") user = await User.getUserByEmail(email);
    else if (userRole === "Carehome") user = await Carehome.getCarehome(email);

    if (!user || user.otpCode !== otp || user.otpExpires < Date.now()) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    // OTP is correct - clear it from DB
    user.otpCode = null;
    user.otpExpires = null;
    await user.save();

    const plainUser = user.toObject();

    const userId =
      userRole === "NGO"
        ? plainUser.ngoId
        : userRole === "Carehome"
        ? plainUser.carehomeId
        : plainUser.userId;

    const token = jwt.sign(
      { id: userId, role: userRole },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });
    // NOW we set the session
    req.session.isAuth = true;
    req.session.userRole = userRole;
    req.session.user = plainUser;

    let dashboardUrl = "";
    if (userRole === "NGO") dashboardUrl = `/NGO-dashboard/${plainUser.ngoId}`;
    if (userRole === "Donor")
      dashboardUrl = `/donor-dashboard/${plainUser.userId}`;
    if (userRole === "Carehome")
      dashboardUrl = `/carehome-dashboard/${plainUser.carehomeId}`;
    switch (userRole) {
      case "NGO":
        dashboardUrl = `/NGO-dashboard/${plainUser.ngoId}`;
        break;
      case "Donor":
        dashboardUrl = `/donor-dashboard/${plainUser.userId}`;
        break;
      case "Carehome":
        dashboardUrl = `/carehome-dashboard/${plainUser.carehomeId}`;
        break;
    }

    req.session.save((err) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Session save error" });
      }

      return res.status(200).json({
        success: true,
        role: userRole,
        user: user,
        redirect: dashboardUrl,
      });
    });
  } catch (err) {
    console.error("Verification error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

//new feature : forgot password

// Function to handle "Forgot Password" by sending a login OTP
async function forgotPassword(req, res) {
  const { email, userRole } = req.body;

  try {
    let user = null;

    // 1. Identify the user across your three models
    if (userRole === "NGO") {
      user = await NGO.getNGO(email);
    } else if (userRole === "Donor") {
      user = await User.getUserByEmail(email);
    } else if (userRole === "Carehome") {
      user = await Carehome.getCarehome(email);
    }

    // 2. If user doesn't exist, send the "sign up newly" error
    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "No account found with this email. Please enter a correct email or sign up newly.",
      });
    }

    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60000); // 10 min window for recovery

    user.otpCode = otp;
    user.otpExpires = expires;
    await user.save();

    try {
      await sendOTPEmail(user.email, otp); //already existing service
      return res.status(200).json({
        success: true,
        message: "A secure login code has been sent to your email.",
      });
    } catch (mailErr) {
      console.error("Forgot Pass Mail Error:", mailErr);
      return res
        .status(500)
        .json({ success: false, message: "Failed to send recovery email." });
    }
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

function checkAuth(req, res) {
  return res.status(200).json({
    user: req.user,
    role: req.user.role,
  });
}

function logout(req, res) {
  res.clearCookie("token");
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}

module.exports = {
  signup,
  login,
  checkAuth,
  logout,
  isAuth,
  verifyOTP,
  forgotPassword,
};
