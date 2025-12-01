const { User } = require("../models/user.model");
const { NGO } = require("../models/NGO.model");
const { Carehome } = require("../models/carehome.model");
const bcrypt = require("bcryptjs");

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
      if (email === "fsd@gmail.com" && password === "123") {
        return res.status(200).json({
          success: true,
          message: "Admin login successful",
          role: "Admin",
          redirect: "/admin-dashboard"
        });
      }
      return res.status(401).json({ success: false, message: "Invalid admin credentials" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid user role" });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: `${userRole} does not exist` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Incorrect password" });

    const plainUser = user.toObject();

    req.session.isAuth = true;
    req.session.userRole = userRole;
    req.session.user = plainUser;

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
      message: "Login successful",
      role: userRole,
      user: plainUser,
      redirect: dashboardUrl,
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

function checkSession(req, res) {
  console.log("in Check session");
  if (!req.session.isAuth || !req.session.user) {
    return res.json({ loggedIn: false });
  }

  console.log(req.session.userRole);
  return res.json({
    loggedIn: true,
    role: req.session.userRole,
    user: req.session.user
  });
}


function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error logging out",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  });
}

module.exports = {
  signup,
  login,
  checkSession,
  logout,
  isAuth,
};
