let User = require("../models/user.model");

function getSignup(req, res) {
  res.render("users/signup");
}

function getLogin(req, res) {
  res.render("login");
}

function signup(req, res) {
  const { name, email, password, repass, phone } = req.body;

  User.userExists(email)

  if (existingUser) {
    return res.render("signup", {
      error: "A user with this email already exists.",
    });
  }

  const newUser = {
    id: newUserId,
    name: name,
    email: email,
    password: password,
    participatedEvents: [],
    contributedFundraisers: [],
    upcomingEvents: [],
    phone: phone,
  };
}

function login(req, res) {
  res.render("users/landing-page");
}

module.exports = {
  getSignup: getSignup,
  getLogin: getLogin,
  signup: signup,
  login: login,
};
