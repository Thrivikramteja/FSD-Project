const { User } = require("../models/user.model");
// const NGO = require("../models/NGO.model");
const { NGO } = require("../models/NGO.model");
const Carehome = require("../models/carehome.model");

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
    receive_notifications: checkbox,
  });

  try {
    const exists = await User.getUser(mail);

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
  const { UserRole, email, password } = req.body;

  try {
    let user = null;

    if (UserRole === "NGO") {
      user = await NGO.getNGO(email);
      console.log(user);

      if (!user) {
        console.log("NGO does not exist.");
        return res.render("login", { error: "NGO does not exist." });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log("Incorrect password.");
        return res.render("login", { error: "Incorrect password." });
      }

      req.session.isAuth = true;
      console.log(user.ngoId);
      return res.redirect(`/NGO-dashboard/${user.ngoId}`);
    } else if (UserRole === "Donor") {
      user = await User.getUser(email);

      if (!user) {
        console.log("Donor does not exist.");
        return res.render("login", { error: "Donor does not exist." });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log("Incorrect password.");
        return res.render("login", { error: "Incorrect password." });
      }

      req.session.isAuth = true;
      return res.redirect(`/user-dashboard/${user.id_donor}`);
    } else if (UserRole === "Carehome") {
      user = await Carehome.getCarehome(email);

      if (!user) {
        console.log("Carehome does not exist.");
        return res.render("login", { error: "Carehome does not exist." });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log("Incorrect password.");
        return res.render("login", { error: "Incorrect password." });
      }

      req.session.isAuth = true;
      return res.redirect(`/carehome-dashboard/${user.id_carehome}`);
    }

    console.log("Invalid user role.");
    res.render("login", { error: "Invalid user role." });
  } catch (error) {
    console.error("Login error:", error);
    res.redirect("/login");
  }
}
// async function login(req, res) {
//   const { UserRole, email, password } = req.body;

//   console.log("in login " + UserRole);

//   try {
//     let user = null;

//     if (UserRole === "NGO") {
//       user = await new Promise((resolve, reject) => {
//         NGO.getNGO(email, (err, row) => {
//           if (err) return reject(err);
//           resolve(row);
//         });
//       });

//       if (!user) {
//         console.log("NGO does not exist.");
//         return res.render("login", {error: "NGO does not exist."});
//       }

//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) {
//         console.log("Incorrect password.");
//         return res.render("login", {error:"Incorrect password."});
//       }

//       req.session.isAuth = true;
//       return res.redirect(`/NGO-dashboard/${user.id_NGO}`);

//     } else if (UserRole === "Donor") {
//       user = await User.getUser(email);

//       if (!user) {
//         console.log("Donor does not exist.");
//         return res.render("login", {error:"Donor does not exist."});
//       }

//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) {
//         console.log("Incorrect password.");
//         return res.render("login", {error:"Incorrect password."});
//       }

//       req.session.isAuth = true;
//       return res.redirect(`/user-dashboard/${user.id_donor}`);

//     } else if (UserRole === "Carehome") {
//       user = await new Promise((resolve, reject) => {
//         Carehome.getCarehome(email, (err, row) => {
//           if (err) return reject(err);
//           resolve(row);
//         });
//       });

//       if (!user) {
//         console.log("Carehome does not exist.");
//         return res.render("login", {error:"Carehome does not exist."});
//       }

//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) {
//         console.log("Incorrect password.");
//         return res.render("login", {error:"Incorrect password."});
//       }

//       req.session.isAuth = true;
//       return res.redirect(`/carehome-dashboard/${user.id_carehome}`);
//     }

//     console.log("Invalid user role.");
//     res.render("login", {error:"Invalid user role."});

//   } catch (error) {
//     console.error("Login error:", error);
//     res.redirect("/login");
//   }
// }

module.exports = {
  getSignup: getSignup,
  getLogin: getLogin,
  signup: signup,
  login: login,
  isAuth,
};
