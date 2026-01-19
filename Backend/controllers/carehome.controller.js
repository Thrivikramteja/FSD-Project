const path = require("path");
const bcrypt = require("bcrypt");

const { Carehome } = require("../models/carehome.model");
const { DonationMoney, donate_items } = require("../models/carehome.model");
const { donate_items_mes, user_message } = require("../models/user.model");
const { CareHomeJob } = require("../models/carehome.model");

async function getCareHomesApi(req, res) {
  try {
    const carehomes = await Carehome.getCareHomes();
    res.json(carehomes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch carehomes" });
  }
}

async function donateMoney(req, res) {
  try {
    const carehomes = await Carehome.getCareHomes();
    const selectedCareHomeId = req.query.carehome_id || null;

    res.render("carehomes/donate_money", {
      carehomes,
      selectedCareHomeId,
      user: req.user || null,
      userRole: req.user?.role || null,
    });
  } catch (error) {
    res.status(500).send("Server Error");
  }
}

async function insertMoney(req, res) {
  try {
    if (req.user.role !== "Donor") {
      return res.status(403).json({ message: "Only donors can donate money" });
    }

    const total = parseFloat(req.body.total);
    const userId = req.user.id;
    const carehomeId = parseInt(req.params.carehomeId, 10);

    if (!userId || !carehomeId || isNaN(total)) {
      return res.status(400).json({
        message: "Missing or invalid data OR Login as user and try to donate money",
      });
    }

    await DonationMoney.saveDonation({
      userId,
      amount_donated: total,
      carehomeId,
      user: req.user,
      userRole: req.user.role,
    });

    res.status(200).json({
      message: "Donation saved successfully",
      redirectUrl: "/",
    });
  } catch (error) {
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
      user: req.user || null,
      userRole: req.user?.role || null,
    });
  } catch {
    res.status(500).send("Server Error");
  }
}

async function get_don_items(req, res) {
  try {
      if (!req.user || req.user.role !== "Donor")
         {
            return res.status(403).json({ 
              success: false, 
              message: "Access Denied: Only registered donors can submit item donation requests." 
            });
          }

    const carehomeId = parseInt(req.body.carehomes, 10);
    const category = req.body.category;
    const description = req.body.description || "";
    const location = req.body.address;
    const deliveryDate = new Date(req.body.date);
    const userId = req.user.id;

    if (!carehomeId || !category || !location || !deliveryDate || !userId) {
      return res.status(400).json({
        error: "All fields except description are required.",
      });
    }

    const newDonationMessage = new donate_items_mes({
      carehomeId,
      userId,
      category,
      delivery_date: deliveryDate,
      location,
      description,
    });

    await newDonationMessage.save();

    res.status(200).json({
      success: true,
      message: "Your donation request has been sent successfully.",
    });
  } catch {
    res.status(500).json({
      error: "Failed to save the donation message.",
    });
  }
}

async function registerCarehome(req, res) {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  const imagePath = req.file.path
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
      imagePath,
    });

    await carehome.save();

    res.status(200).json({
      message: "Carehome Registration successful",
    });
  } catch {
    res.status(500).send("Registration failed");
  }
}

async function getCarehome(req, res) {
  const careid = parseInt(req.params.carehomeId, 10);

  if (req.user.role !== "Carehome" || req.user.id !== careid) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const ongoing_fund = await Carehome.ongoing_fund(careid);
    const completed_fund = await Carehome.completed_fund(careid);
    const recentDonations = await Carehome.recentDonations(careid);
    const getname = await Carehome.getname(careid);
    const wishlist = await Carehome.getWishlist(careid);
    const stats = await Carehome.get_carehome_stats(careid);
    const messages = await Carehome.getMessages(careid);
    const items = await donate_items.get_item_donations(careid);

    res.json({
      name: getname.care_home_name,
      ongoing_fund,
      completed_fund,
      recentDonations,
      wishlist,
      careid,
      stats,
      messages,
      items,
      user: req.user,
      userRole: req.user.role,
    });
  } catch {
    res.status(500).json({ error: "Dashboard load failed" });
  }
}

async function accpet_item_doantions(req, res) {
  try {
    // Safety Check: Identity & Role
    if (req.user.role !== "Carehome" || String(req.user.id) !== String(req.body.carehomeId)) {
        return res.status(403).json({ success: false, message: "Forbidden: Identity mismatch" });
    }

    const { action, carehomeId, category, delivery_date, location, description, userId } = req.body;

    // 1. Move to permanent records if accepted
    if (action === "accept") {
        await new donate_items({
            userId,
            carehomeId,
            category,
            delivery: delivery_date,
            description,
            location,
            donated_at: Date.now(),
        }).save();
    }

    // 2. Remove the request from the "Inbox"
    await donate_items_mes.findOneAndDelete({
        userId,
        carehomeId,
        category,
        location,
    });

    // 3. Notify the donor
    await new user_message({
        carehomeId,
        userId,
        message: action === "accept" ? "Your donation request was approved!" : "Your donation request was declined.",
        category,
        delivery: delivery_date,
        when_date: Date.now(),
    }).save();

    res.json({ success: true, message: `Request ${action}ed successfully.` });

  } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
  }
}
async function editCarehomeProfile(req, res) {
  const careId = parseInt(req.params.carehomeId, 10);

  if (req.user.role !== "Carehome" || req.user.id !== careId) {
    return res.status(403).json({ message: "Forbidden" });
  }

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

  try {
    const updatedCarehome = await Carehome.findOneAndUpdate(
      { carehomeId: careId },
      {
        care_home_name: fullname,
        contact: phne,
        state,
        city,
        email: mail,
        reg_number: gvtid,
        account_holder: bank,
        account_number: accnum,
        ifsc,
        wishlist,
      },
      { new: true }
    );

    if (!updatedCarehome) {
      return res.status(404).json({ message: "Care Home not found for update." });
    }

    res.status(200).json({
      success: true,
      message: "Care Home details updated successfully.",
      carehome: updatedCarehome,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Server error occurred while updating the profile.",
    });
  }
}

async function post_createjob(req, res) {
  try {

    if (!req.user || req.user.role !== "Carehome") {
      return res.status(403).json({ 
        success: false, 
        message: "Access Denied: Only Carehomes can post job listings." 
      });
    }

    const { title, description, location, pay, type, startDate, endDate } = req.body;


    if (!title || !description || !pay) {
      return res.status(400).json({ 
        success: false, 
        message: "Title, description, and pay are required fields." 
      });
    }

    const job = new CareHomeJob({
      postedBy: String(req.user.id), 
      title,
      description,
      location,
      pay,
      type,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    });

    // 4. Save to Database
    await job.save();

    // 5. Success Response
    // Providing a redirectUrl helps the React frontend know where to go next
    return res.status(201).json({
      success: true,
      message: "Job listing published successfully!",
      redirectUrl: `/carehome-dashboard/${req.user.id}`,
    });

  } catch (error) {
    console.error("Create Job Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "An internal server error occurred while creating the job." 
    });
  }
}

async function get_alljobs(req, res) {
  try {
    const jobs = await CareHomeJob.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      jobs,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

module.exports = {
  donateMoney,
  register,
  donateItems,
  registerCarehome,
  getCarehome,
  getCareHomesApi,
  insertMoney,
  accpet_item_doantions,
  get_don_items,
  editCarehomeProfile,
  post_createjob,
  get_alljobs,
};
