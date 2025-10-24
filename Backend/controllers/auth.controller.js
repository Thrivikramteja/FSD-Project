const { User } = require("../models/user.model");
const { NGO } = require("../models/NGO.model");
const { Carehome } = require("../models/carehome.model");
const { admin } = require("../models/admin.model");

const bcrypt = require("bcryptjs");

const isAuth = (req, res, next) => {
  if (req.session.isAuth) {
    next();
  } else {
    res.redirect("/login");
  }
};

function getSignup(req, res) {
  const error = req.query.error || "";
  res.render("users/signup", { error });
}

function getLogin(req, res) {
  const error = " ";
  res.render("login", { error });
}

async function signup(req, res) {
  const { fullname, mail, password, repass, phone, checkbox } = req.body;
  const user = new User({
    name: fullname,
    email: mail,
    password: password,
    mobile_number: phone,
    receive_notifications: checkbox === "on",
  });

  try {
    const exists = await User.getUserByEmail(mail);

    if (exists) {
      console.log("User already exists.");
      return res.render("users/signup", { error: "User already exists" });
    }
    await user.signup();
    console.log("User registered successfully.");
    res.redirect("/login");
  } catch (error) {
    console.log(error);
    console.log("Error during signup:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function login(req, res) {
  const { userRole, email, password } = req.body;

  console.log(userRole, email, password);
  try {
    let user = null;

    if (!userRole || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (userRole === "NGO") {
      user = await NGO.getNGO(email);
      if (!user) {
        return res.status(404).json({ message: "NGO does not exist." });
      }
    } else if (userRole === "Donor") {
      user = await User.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "Donor does not exist." });
      }
    } else if (userRole === "Carehome") {
      user = await Carehome.getCarehome(email);
      if (!user) {
        return res.status(404).json({ message: "Carehome does not exist." });
      }
    } else if (userRole === "Admin") {
      if (email === "fsd@gmail.com" && password === "123") {
        return res.status(200).json({
          message: "Admin login successful",
          role: "Admin",
        });
      } else {
        return res.status(401).json({ message: "Invalid admin credentials." });
      }
    } else {
      return res.status(400).json({ message: "Invalid user role." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    req.session.isAuth = true;
    req.session.userRole = userRole;
    req.session.user = user;

    const userInfo = { ...user };
    delete userInfo.password;

    let dashboardUrl = "";
    switch (userRole) {
      case "NGO":
        dashboardUrl = `/NGO-dashboard/${user.ngoId}`;
        break;
      case "Donor":
        dashboardUrl = `/user-dashboard/${user.userId}`;
        break;
      case "Carehome":
        dashboardUrl = `/carehome-dashboard/${user.carehomeId}`;
        break;
    }

    return res.status(200).json({
      message: "Login successful",
      role: userRole,
      user: userInfo,
      redirect: dashboardUrl,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
}

// async function login(req, res) {
//   const { userRole, email, password } = req.body;

//   try {
//     let user = null;

//     if (userRole === "NGO") {
//       user = await NGO.getNGO(email);
//       console.log(user);

//       if (!user) {
//         console.log("NGO does not exist.");
//         return res.render("login", { error: "NGO does not exist." });
//       }

//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) {
//         console.log("Incorrect password.");
//         return res.render("login", { error: "Incorrect password." });
//       }

//       req.session.isAuth = true;
//       req.session.userRole = userRole;
//       req.session.user = user;
//       return res.redirect(`/NGO-dashboard/${user.ngoId}`);
//     } else if (userRole === "Donor") {
//       user = await User.getUserByEmail(email);

//       if (!user) {
//         console.log("Donor does not exist.");
//         return res.render("login", { error: "Donor does not exist." });
//       }

//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) {
//         console.log("Incorrect password.");
//         return res.render("login", { error: "Incorrect password." });
//       }

//       req.session.isAuth = true;
//       req.session.userRole = userRole;
//       req.session.user = user;
//       console.log(user);
//       return res.redirect(`/user-dashboard/${user.userId}`);
//     } else if (userRole === "Carehome") {
//       user = await Carehome.getCarehome(email);

//       if (!user) {
//         console.log("Carehome does not exist.");
//         return res.render("login", { error: "Carehome does not exist." });
//       }

//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) {
//         console.log("Incorrect password.");
//         return res.render("login", { error: "Incorrect password." });
//       }

//       req.session.isAuth = true;
//       req.session.userRole = userRole;
//       req.session.user = user;
//       return res.redirect(`/carehome-dashboard/${user.carehomeId}`);
//     }
//     else if (userRole === "Admin") {
//       if (email == "fsd@gmail.com" && password == "123") {

//         // res.session.isAuth = true;
//         // res.session.userRole = userRole;
//         // res.session.user = user;
//         return res.redirect('/admin-dashboard');
//       }
//     }

//     console.log("Invalid user role.");
//     res.render("login", { error: "Invalid user role." });
//   } catch (error) {
//     console.error("Login error:", error);
//     res.redirect("/login");
//   }
// }

function logout(req, res) {
  req.session.destroy(err => {
    if (err) return res.send('Error logging out');
    res.redirect('/');
  });
}

module.exports = {
  getSignup: getSignup,
  getLogin: getLogin,
  signup: signup,
  login: login,
  isAuth,
  logout,
};
