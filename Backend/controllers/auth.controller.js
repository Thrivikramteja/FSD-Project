const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const { User } = require("../models/user.model");
const { NGO } = require("../models/NGO.model");
const { Carehome } = require("../models/carehome.model");

const { generateOTP, sendOTPEmail } = require("../services/otpService");

// Admin Credentials
const ADMIN_EMAIL = "chinnikarthik22@gmail.com";
const ADMIN_PASS = "wbd_3";

async function signup(req, res, next) {
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
      password,
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
    error.message = "Internal Server Error";
    next(error);
  }
}

async function login(req, res, next) {
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
      if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
        user = await User.getUserByEmail(email);
        if (!user) {
            // If admin isn't in DB yet, create a placeholder so save() works
            user = new User({ name: "Admin", email: email, password: password, role: "Admin" });
        }
      } else {
        return res.status(401).json({ success: false, message: "Invalid admin credentials" });
      }
    } else {
      return res.status(400).json({ success: false, message: "Invalid user role" });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${userRole} does not exist`,
      });
    }

    // Admin password check is already done above, standard roles checked here
    if (userRole !== "Admin") {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            message: "Incorrect password",
          });
        }
    }

    const otp = generateOTP();
    user.otpCode = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); 
    await user.save();

    return res.status(200).json({
      success: true,
      twoFactorRequired: true,
      email: user.email,
      role: userRole,
      message: "OTP sent to your email",
    });
  } catch (err) {
    console.error("Login error:", err);
    err.message = "Internal server error";
    next(err);
  }
}

async function verifyOTP(req, res, next) {
  const { email, otp, userRole } = req.body;

  try {
    let user = null;

    if (userRole === "NGO") user = await NGO.getNGO(email);
    else if (userRole === "Donor" || userRole === "Admin") user = await User.getUserByEmail(email);
    else if (userRole === "Carehome") user = await Carehome.getCarehome(email);

    if (!user || user.otpCode !== otp || user.otpExpires < Date.now()) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    user.otpCode = null;
    user.otpExpires = null;
    await user.save();

    const plainUser = user.toObject();

    const userId =
      userRole === "NGO"
        ? plainUser.ngoId
        : userRole === "Carehome"
        ? plainUser.carehomeId
        : userRole === "Admin" ? "ADMIN_ID" : plainUser.userId;

    const token = jwt.sign(
      { 
        id: userId, 
        role: userRole,
        name: plainUser.name || "Admin",
        email: plainUser.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, 
    });

    let dashboardUrl = "";
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
      case "Admin":
        dashboardUrl = `/admin-dashboard`;
        break;
    }

    return res.status(200).json({
      success: true,
      role: userRole,
      user: plainUser,
      redirect: dashboardUrl,
    });
  } catch (err) {
    console.error("Verification error:", err);
    err.message =  "Internal server error";
    next(err);
  }
}

async function forgotPassword(req, res, next) { // added next
  const { email, userRole } = req.body;

  try {
    let user = null;

    if (userRole === "NGO") user = await NGO.getNGO(email);
    else if (userRole === "Donor") user = await User.getUserByEmail(email);
    else if (userRole === "Carehome") user = await Carehome.getCarehome(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email. Please enter a correct email or sign up newly.",
      });
    }

    const otp = generateOTP();
    user.otpCode = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save();

    await sendOTPEmail(user.email, otp);

    return res.status(200).json({
      success: true,
      message: "A secure login code has been sent to your email.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    err.message = "Internal server error"
    next(err);
  }
}

async function checkAuth(req, res, next) {
  try {
    const { id, role } = req.user;
    
    // Minimal change: Bypass DB check for static Admin
    if (role === "Admin") {
        return res.status(200).json({
            success: true,
            user: { email: req.user.email, name: "System Admin" },
            role: "Admin",
        });
    }

    let fullUser = null;
    
    if (role === "NGO") {
        fullUser = await NGO.findOne({ ngoId: id }).lean();
    } else if (role === "Donor") {
        fullUser = await User.findOne({ userId: id }).lean();
    } else if (role === "Carehome") {
        fullUser = await Carehome.findOne({ carehomeId: id }).lean();
    }

    if (!fullUser) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user: fullUser ? fullUser : { email: req.user.email, name: "Admin" }, 
      role: role,
    });
  } catch (error) {
    console.error("CheckAuth Error:", error);
    error.message = "Server error during authentication";
    next(error);
  }
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
  verifyOTP,
  forgotPassword,
  checkAuth,
  logout,
};