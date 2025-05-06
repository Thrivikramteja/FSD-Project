const {Carehome} = require("../models/carehome.model");
const bcrypt = require('bcrypt');

async function donateMoney(req, res) {
  try {
    const carehomes = await Carehome.getCareHomes();
    res.render("carehomes/donate_money", { carehomes });
  } catch (error) {
    console.error("Error fetching carehomes:", error);
    res.status(500).send("Server Error");
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
      password: hashedPassword, // Hashing
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
  const careid = parseInt(req.params.carehomeId,10);

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
    const carehomes = await Carehome.getallcarehomes();
      
    console.log("fetched care homes : ", carehomes);
    res.render("carehomes/carehomes", { carehomes });
  } catch (error) {
    console.log("error while fetching the care homes ", error);
  }
}

// async function view_details_care(req, res) {
//   const careid = req.params.careid;

//   try {
//     console.log("Fetching data for care home ID:", careid);

//     const details = await Carehome.get_care_data(careid);
//     if (!details) {
//       return res.status(404).json({ error: "Care home not found." });
//     }

//     console.log("Fetched care home details:", details);
//     console.log("wishlist: "+ details.wishlist);
//     res.render("carehomes/view_care", {details} );
//   } catch (error) {
//     console.log("Error while fetching care home details:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// }

async function view_details_care(req, res) 
{
  try {
    const careId = parseInt(req.params.careid, 10);
    console.log("care id: " + careId);
    const carehome = await Carehome.get_care_data(careId);
    

    if (carehome) {
      // Convert wishlist from string to array
      carehome.wishlist = carehome.wishlist
        ? carehome.wishlist.split(',').map(item => item.trim())
        : [];

      res.render('carehomes/view_care', { details: carehome });
    } else {
      res.status(404).send('Carehome not found');
    }
  } catch (error) {
    console.error("Error in viewDetailsCare:", error);
    res.status(500).send("Failed to load carehome details");
  }
}

function getEditCarehomeProfile() {}

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
};