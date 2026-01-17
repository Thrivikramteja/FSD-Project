const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const { User } = require("../models/user.model");
const { NGO } = require("../models/NGO.model");
const { Carehome } = require("../models/carehome.model");

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

    let dashboardUrl = "";
    if (userRole === "NGO") dashboardUrl = `/NGO-dashboard/${plainUser.ngoId}`;
    if (userRole === "Donor")
      dashboardUrl = `/donor-dashboard/${plainUser.userId}`;
    if (userRole === "Carehome")
      dashboardUrl = `/carehome-dashboard/${plainUser.carehomeId}`;

    return res.status(200).json({
      success: true,
      role: userRole,
      user: user,
      redirect: dashboardUrl,
    });
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
};
