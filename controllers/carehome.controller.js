const Carehome = require("../models/carehome.model");

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
    res.render("carehomes/donate_items", {carehomes});
  } catch (error) {
    console.error("Error fetching carehomes:", error);
    res.status(500).send("Server Error");
  }
}

async function registerCarehome(req, res) {
  const {
    care_home_name,
    reg_number,
    email,
    password,
    contact,
    state,
    city,
    num_residents,
    avg_expense,
    wishlist,
    description,
    account_holder,
    account_number,
    ifsc,
    terms,
  } = req.body;

  const carehome = new Carehome(
    care_home_name,
    reg_number,
    email,
    password,
    contact,
    state,
    city,
    num_residents,
    avg_expense,
    wishlist,
    description,
    account_holder,
    account_number,
    ifsc,
    terms
  );

  await carehome.storeCarehome();
  res.redirect("/login");
}

async function getCarehome(req, res) {
  const careid = req.params.carehomeId;

  try {
    console.log("Fetching data for Care Home ID:", careid);

    const ongoing_fund = await new Promise((resolve) => {
      Carehome.ongoing_fund(careid, (err, data) => {
        if (err) {
          console.error("Error fetching ongoing_fund:", err);
          resolve([]);
        } else {
          resolve(data);
        }
      });
    });

    const completed_fund = await new Promise((resolve) => {
      Carehome.completed_fund(careid, (err, data) => {
        if (err) {
          console.error("Error fetching completed_fund:", err);
          resolve([]);
        } else {
          resolve(data);
        }
      });
    });

    const recentDonations = await new Promise((resolve) => {
      Carehome.recentDonations(careid, (err, data) => {
        if (err) {
          console.error("Error fetching recentDonations:", err);
          resolve([]);
        } else {
          resolve(data);
        }
      });
    });

    const getname = await new Promise((resolve) => {
      Carehome.getname(careid, (err, data) => {
        if (err) {
          console.error("Error fetching getname:", err);
          resolve("Unknown Care Home");
        } else {
          resolve(data);
        }
      });
    });

    const wishlist = await new Promise((resolve) => {
      Carehome.getWishlist(careid, (err, data) => {
        if (err) {
          console.error("Error fetching wishlist:", err);
          resolve("Wishlist not available or has not been updated yet.");
        } else {
          resolve(data);
        }
      });
    });
    const stats = await new Promise((resolve) => {
      Carehome.get_carehome_stats(careid, (err, data) => {
        if (err) {
          console.err("error fetching stats of caare home", err);
          resolve("null");
        } else {
          resolve(data);
        }
      });
    });

    console.log("Fetched Data:");
    console.log("Ongoing Fundraisers:", ongoing_fund);
    console.log("Completed Fundraisers:", completed_fund);
    console.log("Recent Donations:", recentDonations);
    console.log("Care Home Name:", getname);
    console.log("Wishlist:", wishlist);
    console.log("stats:", stats);

    // Render the EJS template with the fetched data
    res.render("carehomes/carehome_dashboard", {
      name: getname,
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

async function getallcarehomes(req,res)
{

  try
  {
    const carehomes =  await new Promise((resolve)=>{
      Carehome.getallcarehoms((err,data)=>{
        if(err)
        {
          console.log("error while fetching the data of care homes ",err);
          resolve([]);
        }
        else
        {
          resolve(data);
        }
      })
    })
    console.log("fetched care homes : ", carehomes);
    res.render('carehomes/carehomes',{carehomes});
    
  }
  catch(error)
  {
    console.log("error while fetching the care homes ",error);
  }

}


async function view_details_care(req, res) 
{
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
