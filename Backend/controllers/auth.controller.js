const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const { User } = require("../models/user.model");
const { NGO } = require("../models/NGO.model");
const { Carehome } = require("../models/carehome.model");

const { generateOTP, sendOTPEmail } = require("../services/otpService");

const {
  reserveOTPSend,
  releaseOTPSend,
  canAttemptEmail,
  recordEmailSuccess,
  recordEmailFailure,
  shouldFallbackToPassword,
} = require("../services/otpProtection");

// Admin Credentials
const ADMIN_EMAIL = "chinnikarthik22@gmail.com";
const ADMIN_PASS = "123456";

const REQUIRE_LOGIN_OTP =
  process.env.REQUIRE_LOGIN_OTP !== "false";

/**
 * Creates the JWT and sends the authentication cookie.
 * This is used both after OTP verification and when
 * the emergency password-only fallback is active.
 */
const completeLogin = (res, user, userRole) => {
  const plainUser = user.toObject();

  const userId =
    userRole === "NGO"
      ? plainUser.ngoId
      : userRole === "Carehome"
      ? plainUser.carehomeId
      : userRole === "Admin"
      ? "ADMIN_ID"
      : plainUser.userId;

  const token = jwt.sign(
    {
      id: userId,
      role: userRole,
      name: plainUser.name || "Admin",
      email: plainUser.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    maxAge: 24 * 60 * 60 * 1000,
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

  return {
    user: plainUser,
    role: userRole,
    redirect: dashboardUrl,
  };
};

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
          user = new User({
            name: "Admin",
            email: email,
            password: password,
            role: "Admin",
          });
        }
      } else {
        return res.status(401).json({
          success: false,
          message: "Invalid admin credentials",
        });
      }
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

    // Admin password check is already done above.
    // Standard roles are checked here.
    if (userRole !== "Admin") {
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Incorrect password",
        });
      }
    }

    /**
     * Feature flag:
     *
     * REQUIRE_LOGIN_OTP=false
     *
     * Completely disables OTP requirement.
     * This is intended as an emergency/demo switch.
     */
    if (!REQUIRE_LOGIN_OTP) {
      const loginData = completeLogin(res, user, userRole);

      return res.status(200).json({
        success: true,
        twoFactorRequired: false,
        otpFallback: true,
        ...loginData,
        message: "Login successful",
      });
    }

    /**
     * Check the EmailJS circuit before doing anything
     * that could generate another email.
     */
    const circuit = await canAttemptEmail();

    if (!circuit.allowed) {
      const fallback = await shouldFallbackToPassword();

      if (fallback) {
        console.warn(
          "⚠️ OTP circuit is OPEN. Using password-only fallback login."
        );

        const loginData = completeLogin(res, user, userRole);

        return res.status(200).json({
          success: true,
          twoFactorRequired: false,
          otpFallback: true,
          ...loginData,
          message: "Login successful using emergency OTP fallback",
        });
      }

      return res.status(503).json({
        success: false,
        message:
          "OTP service is temporarily unavailable. Please try again later.",
      });
    }

    /**
     * Reserve the OTP send slot in Redis.
     *
     * This prevents:
     *
     * Enter
     * Enter
     * Enter
     *
     * from generating three emails.
     */
    const otpReservation = await reserveOTPSend(user.email);

    if (!otpReservation.allowed) {
      return res.status(429).json({
        success: false,
        message:
          "OTP was already sent recently. Please check your email or wait before requesting another code.",
      });
    }

    const otp = generateOTP();

    user.otpCode = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    await user.save();

    try {
      await sendOTPEmail(user.email, otp);

      await recordEmailSuccess();

      return res.status(200).json({
        success: true,
        twoFactorRequired: true,
        email: user.email,
        role: userRole,
        message: "OTP sent to your email",
      });
    } catch (emailError) {
      console.error("OTP email failed:", emailError);

      /**
       * Email failed, so release the user's cooldown.
       * This allows them to retry.
       */
      await releaseOTPSend(user.email);

      const circuitResult = await recordEmailFailure(emailError);

      const fallback = await shouldFallbackToPassword();

      if (fallback) {
        console.warn(
          "⚠️ OTP circuit opened. Using password-only fallback login."
        );

        const loginData = completeLogin(res, user, userRole);

        return res.status(200).json({
          success: true,
          twoFactorRequired: false,
          otpFallback: true,
          ...loginData,
          message: "Login successful using emergency OTP fallback",
        });
      }

      return res.status(503).json({
        success: false,
        message:
          "We could not send the OTP right now. Please try again shortly.",
        circuitOpened: circuitResult.circuitOpened,
      });
    }
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

    if (userRole === "NGO") {
      user = await NGO.getNGO(email);
    } else if (userRole === "Donor" || userRole === "Admin") {
      user = await User.getUserByEmail(email);
    } else if (userRole === "Carehome") {
      user = await Carehome.getCarehome(email);
    }

    if (!user || user.otpCode !== otp || user.otpExpires < Date.now()) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    user.otpCode = null;
    user.otpExpires = null;

    await user.save();

    const loginData = completeLogin(res, user, userRole);

    return res.status(200).json({
      success: true,
      ...loginData,
    });
  } catch (err) {
    console.error("Verification error:", err);
    err.message = "Internal server error";
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  const { email, userRole } = req.body;

  try {
    let user = null;

    if (userRole === "NGO") {
      user = await NGO.getNGO(email);
    } else if (userRole === "Donor") {
      user = await User.getUserByEmail(email);
    } else if (userRole === "Carehome") {
      user = await Carehome.getCarehome(email);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "No account found with this email. Please enter a correct email or sign up newly.",
      });
    }

    const otp = generateOTP();

    user.otpCode = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    await sendOTPEmail(user.email, otp);

    return res.status(200).json({
      success: true,
      message: "A secure login code has been sent to your email.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    err.message = "Internal server error";
    next(err);
  }
}

async function checkAuth(req, res, next) {
  try {
    const { id, role } = req.user;

    if (role === "Admin") {
      return res.status(200).json({
        success: true,
        user: {
          email: req.user.email,
          name: "System Admin",
        },
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
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: fullUser
        ? fullUser
        : {
            email: req.user.email,
            name: "Admin",
          },
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