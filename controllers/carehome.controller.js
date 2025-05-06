const { Carehome } = require("../models/carehome.model");
const bcrypt = require("bcrypt");
const { DonationMoney } = require("../models/carehome.model");

async function donateMoney(req, res) {
  try {
    const carehomes = await Carehome.getCareHomes();
    res.render("carehomes/donate_money", { carehomes });
  } catch (error) {
    console.error("Error fetching carehomes:", error);
    res.status(500).send("Server Error");
  }
}
async function insertMoney(req, res) {
  console.log("inside insertMoney")
  console.log("BODY:", req.body);
  console.log("SESSION:", req.session);
  console.log("PARAMS:", req.params);

  try {
    const total = parseFloat(req.body.total);
    console.log(total);
    const userId = req.session.user?.userId;
    console.log(userId);
    const carehomeId = parseInt(req.params.carehomeId);
    console.log(carehomeId);

    if (!userId || !carehomeId || isNaN(total)) {
      console.log("Error in insertMoney");
      return res.status(400).json({ error: "Missing or invalid data" });
    }

    // const donation = new DonationMoney({
    //   userId,
    //   amount_donated: total,
    //   carehomeId,
    //   donated_at: new Date(),
    // });

    await DonationMoney.saveDonation({
      userId,
      amount_donated: total,
      carehomeId
    });
    res.status(200).json({ message: "Donation saved successfully" });
  } catch (error) {
    console.error("Error saving donation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function register(req, res) {
  res.render("carehomes/care_reg");
}

async function donateItems(req, res) {
  try {
    const carehomes = await Carehome.getCareHomes();
    res.render("carehomes/donate_items", { carehomes });
  } catch (error) {
    console.error("Error fetching carehomes:", error);
    res.status(500).send("Server Error");
  }
}

async function registerCarehome(req, res) {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  try {
    const carehome = new Carehome({
      care_home_name: req.body.care_home_name,
      reg_number: req.body.reg_number,
      email: req.body.email,
      password: hashedPassword, 
      contact: req.body.contact,
      state: req.body.state,
      city: req.body.city,
      num_residents: req.body.num_residents,
      avg_expense: req.body.avg_expense,
      wishlist: req.body.wishlist,
      description: req.body.description,
      account_holder: req.body.account_holder,
      account_number: req.body.account_number,
      ifsc: req.body.ifsc,
      terms: req.body.terms,
    });

    try {
      await carehome.save();
    } catch (error) {
      console.log(error);
    }

    res.redirect("/login");
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).send("Something went wrong during registration.");
  }
}

async function getCarehome(req, res) {
  const careid = parseInt(req.params.carehomeId, 10);

  try {
    console.log("Fetching data for Care Home ID:", careid);

    const ongoing_fund = await Carehome.ongoing_fund(careid);

    const completed_fund = await Carehome.completed_fund(careid);

    const recentDonations = await Carehome.recentDonations(careid);

    const getname = await Carehome.getname(careid);

    const wishlist = await Carehome.getWishlist(careid);

    const stats = await Carehome.get_carehome_stats(careid);

    // console.log("Fetched Data:");
    // console.log("Ongoing Fundraisers:", ongoing_fund);
    // console.log("Completed Fundraisers:", completed_fund);
    // console.log("Recent Donations:", recentDonations);
    // console.log("Care Home Name:", getname);
    // console.log("Wishlist:", wishlist);
    // console.log("stats:", stats);

    // Render the EJS template with the fetched data
    res.render("carehomes/carehome_dashboard", {
      name: getname.care_home_name,
      ongoing_fund,
      completed_fund,
      recentDonations,
      wishlist,
      careid,
      stats,
    });
  } catch (error) {
    console.error("Error in getcarehome controller:", error);
    res.status(500).send("An error occurred while loading the dashboard");
  }
}

async function getallcarehomes(req, res) {
  try {
    const carehomes = await new Promise((resolve) => {
      Carehome.getallcarehoms((err, data) => {
        if (err) {
          console.log("error while fetching the data of care homes ", err);
          resolve([]);
        } else {
          resolve(data);
        }
      });
    });
    console.log("fetched care homes : ", carehomes);
    res.render("carehomes/carehomes", { carehomes });
  } catch (error) {
    console.log("error while fetching the care homes ", error);
  }
}

async function view_details_care(req, res) {
  const careid = req.params.careid;

  try {
    console.log("Fetching data for care home ID:", careid);

    const details = await new Promise((resolve) => {
      Carehome.get_care_data(careid, (err, data) => {
        if (err) {
          console.log("Error fetching data of care home:", err);
          resolve(null); // Resolve with null instead of rejecting
        } else {
          resolve(data.length > 0 ? data[0] : null);
        }
      });
    });

    if (!details) {
      return res.status(404).json({ error: "Care home not found." });
    }

    console.log("Fetched care home details:", details);
    res.render("carehomes/view_care", { details });
  } catch (error) {
    console.log("Error while fetching care home details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

function getEditCarehomeProfile(req, res) {}

function editCarehomeProfile() {}

module.exports = {
  donateMoney,
  register,
  donateItems,
  registerCarehome,
  getCarehome,
  getEditCarehomeProfile,
  editCarehomeProfile,
  getallcarehomes,
  view_details_care,
  insertMoney,
};
