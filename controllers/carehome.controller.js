const User = require("../models/user.model");
const NGO = require("../models/NGO.model");
const Carehome = require("../models/carehome.model");

// function getCarehome(req, res) {

// }

async function donateMoney(req, res) {
  try {
    const carehomes = await Carehome.getCareHomes();
    res.render("carehomes/donate_money", { carehomes });
  } catch (error) {
    console.error("Error fetching carehomes:", error);
    res.status(500).send("Server Error");
  }
}

function register(req, res) {
  res.render('carehomes/care_reg');
}

module.exports = {
  donateMoney,
  register
};
