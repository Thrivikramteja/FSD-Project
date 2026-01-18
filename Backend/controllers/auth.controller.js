const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const { User } = require("../models/user.model");
const { NGO } = require("../models/NGO.model");
const { Carehome } = require("../models/carehome.model");

const { generateOTP, sendOTPEmail } = require("../services/otpService");

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
        const token = jwt.sign(
          { role: "Admin", email: email },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );

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

      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
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
    user.otpCode = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min
    await user.save();

    await sendOTPEmail(user.email, otp);

    return res.status(200).json({
      success: true,
      twoFactorRequired: true,
      email: user.email,
      role: userRole,
      message: "OTP sent to your email",
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
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
        : plainUser.userId;

    // Added name and email to the token so the frontend/middleware can access them easily
    const token = jwt.sign(
      { 
        id: userId, 
        role: userRole,
        name: plainUser.name,
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
    }

    return res.status(200).json({
      success: true,
      role: userRole,
      user: plainUser,
      redirect: dashboardUrl,
    });
  } catch (err) {
    console.error("Verification error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function forgotPassword(req, res) {
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
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Updated checkAuth to perform a quick DB lookup to ensure data freshness
async function checkAuth(req, res) {
  try {
    const { id, role } = req.user;
    let fullUser = null;

    if (role === "NGO") {
        fullUser = await NGO.findOne({ ngoId: id }).lean();
    } else if (role === "Donor") {
        fullUser = await User.findOne({ userId: id }).lean();
    } else if (role === "Carehome") {
        fullUser = await Carehome.findOne({ carehomeId: id }).lean();
    }

    if (!fullUser && role !== "Admin") {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user: fullUser || { email: req.user.email }, 
      role: role,
    });
  } catch (error) {
    console.error("CheckAuth Error:", error);
    return res.status(500).json({ success: false, message: "Server error during authentication" });
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