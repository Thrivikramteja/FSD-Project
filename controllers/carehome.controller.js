const path = require("path");

const { Carehome } = require("../models/carehome.model");
const bcrypt = require("bcrypt");

const { DonationMoney, donate_items } = require("../models/carehome.model");
const { donate_items_mes, user_message } = require("../models/user.model");
const  { CareHomeJob } = require('../models/carehome.model');

async function donateMoney(req, res) {
  try {
    const carehomes = await Carehome.getCareHomes();

    const selectedCareHomeId = req.query.carehome_id || null;
    console.log(selectedCareHomeId);
    res.render("carehomes/donate_money", {
      carehomes,
      selectedCareHomeId,
      user: req.session.user,
      userRole: req.session.userRole,
    });
  } catch (error) {
    console.error("Error fetching carehomes:", error);
    res.status(500).send("Server Error");
  }
}

async function insertMoney(req, res) {
  console.log("inside insertMoney");
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
      return res.status(400).json({
        message: "Missing or invalid data OR Login as user and try to donate money",
      });
    }


    await DonationMoney.saveDonation({
      userId,
      amount_donated: total,
      carehomeId,
      user: req.session.user,
      userRole: req.session.userRole,
    });
    console.log("saved new donation");


    res.status(200).json({ message: "Donation saved successfully", redirectUrl: "/" });
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
    res.render("carehomes/donate_items", {
      carehomes,
      user: req.session.user,
      userRole: req.session.userRole,
    });
  } catch (error) {
    console.error("Error fetching carehomes:", error);
    res.status(500).send("Server Error");
  }
}

async function get_don_items(req, res) {
 try {
 const carehomeId = parseInt(req.body.carehomes);
 console.log("Care Home ID:", carehomeId);

 const category = req.body.category;
 console.log("Category:", category);

 const description = req.body.description || "";
 console.log("Description:", description);

 const location = req.body.address;
 console.log("Location:", location);

 const deliveryDate = new Date(req.body.date);
 console.log("Delivery Date:", deliveryDate);

 const userId = req.session.user.userId;
 console.log("User ID:", userId);

 if (!carehomeId || !category || !location || !deliveryDate || !userId) {
 return res
 .status(400)
 .json({ error: "All fields except description are required." });
 }

 const newDonationMessage = new donate_items_mes({
 carehomeId,
userId,
 category,
 delivery_date: deliveryDate,
 location,
 description
 });

 await newDonationMessage.save();

 console.log(
 `New donation message saved successfully for Carehome ID: ${carehomeId}`
 );


 res.status(200).json({
        success: true,
        message: "Your donation request has been sent to the care home successfully."
    });
    
 } catch (error) {
 console.error("Error while saving donation message:", error);
 res.status(500).json({
 error: "Failed to save the donation message. Please try again later.",
 });
 }
}

async function registerCarehome(req, res) {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  let imagePath = req.file.path
  .split(path.sep)       
  .slice(-3)             
  .join("/");

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
      imagePath: imagePath
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
  const userRole = req.params.userRole;

  try {
    console.log("Fetching data for Care Home ID:", careid);

    const ongoing_fund = await Carehome.ongoing_fund(careid);

    const completed_fund = await Carehome.completed_fund(careid);

    const recentDonations = await Carehome.recentDonations(careid);

    const getname = await Carehome.getname(careid);

    const wishlist = await Carehome.getWishlist(careid);

    const stats = await Carehome.get_carehome_stats(careid);

    const messages = await Carehome.getMessages(careid);

    const items = await donate_items.get_item_donations(careid);
    console.log(items);

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
      messages,
      items,
      user: req.session.user,
      userRole,
    });
  } catch (error) {
    console.error("Error in getcarehome controller:", error);
    res.status(500).send("An error occurred while loading the dashboard");
  }
}

async function getallcarehomes(req, res) {
  try {
    const carehomes = await Carehome.getallcarehomes();

    res.render("carehomes/carehomes", {
      carehomes,
      user: req.session.user,
      userRole: req.session.userRole,
    });
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

async function view_details_care(req, res) {
  try {
    const careId = parseInt(req.params.careid, 10);
    console.log("care id: " + careId);
    const carehome = await Carehome.get_care_data(careId);

    if (carehome) {
      // Convert wishlist from string to array
      carehome.wishlist = carehome.wishlist
        ? carehome.wishlist.split(",").map((item) => item.trim())
        : [];

      res.render("carehomes/view_care", {
        details: carehome,
        user: req.session.user,
        userRole: req.session.userRole,
      });
    } else {
      res.status(404).send("Carehome not found");
    }
  } catch (error) {
    console.error("Error in viewDetailsCare:", error);
    res.status(500).send("Failed to load carehome details");
  }
}

async function accpet_item_doantions(req, res) {
  const whether = req.body.action;
  console.log("Action (whether):", whether);

  const carehomeId = req.body.carehomeId;
  console.log("Care Home ID:", carehomeId);

  const category = req.body.category;
  console.log("Category:", category);

  const delivery = req.body.delivery_date;
  console.log("Delivery Date:", delivery);

  const location = req.body.location;
  console.log("Location:", location);

  const description = req.body.description || "No description provided by donor.";
  console.log("Description:", description);

  const userId = req.body.userId;
  console.log("User ID:", userId);

  if (whether == "accept") {
    console.log("Care home has accepted the donation: " + carehomeId);
    const new_donation = new donate_items({
      userId: userId,
      carehomeId: carehomeId,
      category: category,
      delivery: delivery,
      description: description,
      location: location,
      donated_at: Date.now(),
    });
    await new_donation.save();
    console.log("item accepted from user: " + userId);
    console.log(
      "now removing it from user messages schema for user : " + userId
    );
    const deletedMessage = await donate_items_mes.findOneAndDelete({
      userId: userId,
      carehomeId: carehomeId,
      category: category,
      location: location,
    });

    if (deletedMessage) {
      console.log("Message successfully removed for user: " + userId);
    } else {
      console.log("No matching message found to remove for user: " + userId);
    }
    const new_user_mes = new user_message({
      carehomeId: carehomeId,
      userId: userId,
      message: "accept",
      category: category,
      delivery: delivery,
      when_date: Date.now(),
    });
    await new_user_mes.save();
    console.log("User was acknowledged of acceptance");
  } else {
    console.log("Care home rejcted the donation of user : " + userId);
    const deletedMessage = await donate_items_mes.findOneAndDelete({
      userId: userId,
      carehomeId: carehomeId,
      category: category,
      location: location,
    });

    if (deletedMessage) {
      console.log("Message successfully removed for user: " + userId);
    } else {
      console.log("No matching message found to remove for user: " + userId);
    }
    const new_user_mes = new user_message({
      carehomeId: carehomeId,
      userId: userId,
      message: "reject",
      category: category,
      delivery: delivery,
      when_date: Date.now(),
    });
    await new_user_mes.save();
    console.log("User was acknowledged of rejectance");
  }
}

async function getEditCarehomeProfile(req, res) {
  const careId = parseInt(req.params.carehomeId, 10);
  const carehome = await Carehome.get_care_data(careId);
  res.render("carehomes/carehome_edit", {
    carehome,
    user: req.session.user,
    userRole: req.session.userRole,
  });
}

async function editCarehomeProfile(req, res) {
    const careId = parseInt(req.params.carehomeId, 10);
    console.log("updating carehome: ", careId);
    
   
    const {
      fullname,
      phne,
      state,
      city,
      mail,
      gvtid,
      bank,
      accnum,
      ifsc,
      wishlist,
    } = req.body;

    console.log(fullname + "" + state + "" + city + "" + wishlist);

    try {
      const updatedCarehome = await Carehome.findOneAndUpdate(
        { carehomeId: careId },
        {
          care_home_name: fullname,
          contact: phne,
          state: state,
          city: city,
          email: mail,
          reg_number: gvtid,
          account_holder: bank,
          account_number: accnum,
          ifsc: ifsc,
          wishlist: wishlist,
        },
        { new: true }
      );

      if (!updatedCarehome) {
      
        return res.status(404).json({ message: "Care Home not found for update." });
      }

      res.status(200).json({ 
          success: true, 
          message: "Care Home details updated successfully.",
          carehome: updatedCarehome
      });

    } catch (error) {
        console.error("Error updating Care Home profile:", error);
        
        res.status(500).json({ 
            success: false, 
            message: "Server error occurred while updating the profile." 
        });
    }
}

async function get_createjob(req,res)
{
  console.log("rendering job posting form");
  res.render('carehomes/create_job');
}

async function post_createjob(req, res) {
    try {
      console.log("just now posting the fresh job");
        const carehome = req.session.user; 
        if (!carehome) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { title, description, location, pay, type, startDate, endDate } = req.body;

        const job = new CareHomeJob({
            postedBy: carehome._id, 
            title,
            description,
            location,
            pay,
            type,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null
        });

        await job.save();

        return res.json({
            success: true,
            message: "Job created successfully",
            redirectUrl: `/carehome-dashboard/${carehome.carehomeId}`
        });

    } catch (err) {
        console.error("Error posting job:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}

async function get_alljobs(req, res) {
    try {
        

        const jobs = await CareHomeJob.find().sort({ createdAt: -1 });

        
        res.json({
            success: true,
            jobs
        });
    } catch (err) {
        console.error("Error fetching jobs:", err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}

async function job_render(req,res)
{
  try
  {
    console.log("rendering the list of jobs page");
    res.render('carehomes/list_jobs');
  }
  catch
  {
    console.log("some error occured while loading the jobs page ");
  }
}


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
  accpet_item_doantions,
  get_don_items,
  get_createjob,
  post_createjob,
  get_alljobs,
  job_render,

};
