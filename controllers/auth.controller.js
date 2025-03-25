const User = require("../models/user.model");
const NGO = require("../models/NGO.model");
const Carehome = require("../models/carehome.model");

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
  res.render("login");
}

async function signup(req, res) {
  const { name, mail, password, repass, contact, checkbox } = req.body;

  const user = new User(name, mail, password, contact, checkbox);

  try {
    const exists = await user.existsAlready(mail);
    if (exists) {
      console.log("User already exists.");
      return res.render("signup", {error: "User already exists"});
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

  if (UserRole == "NGO") {
    const ngo = NGO.getNGO(email, (err, row) => {
      if (err) {
        console.log("Error: ", err);
        return;
      }
      if (!row) {
        console.log("NGO does not exist.");
        return;
      }
    });

    if (!ngo) {
      return res.redirect("/login");
    }
    const isMatch = await bcrypt.compare(password, ngo.password);

    if (!isMatch) {
      return res.redirect("/login");
    }

    const ngoId = ngo.id_NGO;
    req.session.isAuth = true;
    res.redirect("/NGO-dashboard/:ngoId");
  } else if (UserRole == "donor") {
    const donor = User.getUser(email, (err, row) => {
      if (err) {
        console.log("Error: ", err);
        return;
      }
      if (!row) {
        console.log("donor does not exist.");
        return;
      }
    });

    if (!donor) {
      return res.redirect("/login");
    }
    const isMatch = await bcrypt.compare(password, donor.password);

    if (!isMatch) {
      return res.redirect("/login"); 
    }

    req.session.isAuth = true;
    const donorId = donor.id_donor;

    res.redirect("/user-dashboard/:donorId");
  } else if (UserRole == "carehome") {
    const carehome = Carehome.getCarehome(email, (err, row) => {
      if (err) {
        console.log("Error: ", err);
        return;
      }
      if (!row) {
        console.log("Carehome does not exist.");
        return;
      }
    });

    if (!carehome) {
      return res.redirect("/login");
    }
    const isMatch = await bcrypt.compare(password, carehome.password);

    if (!isMatch) {
      return res.redirect("/login");
    }

    const carehomeId = carehome.id_carehome;
    req.session.isAuth = true;
    res.redirect("/carehome-dashboard/:carehomeId");
  }
}

module.exports = {
  getSignup: getSignup,
  getLogin: getLogin,
  signup: signup,
  login: login,
  isAuth,
};
