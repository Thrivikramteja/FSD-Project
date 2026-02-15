const { admin } = require("../models/admin.model");
const { NGO, Event } = require("../models/NGO.model");
const { CreatedFundraiser, UserContributedFundraiser, User } = require("../models/user.model");
const { Carehome, DonationMoney } = require('../models/carehome.model');
const { UserRegisteredEvent } = require("../models/user.model");
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function Getadmin(req, res, next) {
  try {
    const [
      highest_Donation,
      high_con_name,
      total_revenue, 
      total_ngo,
      total_care,
      total_money,
      total_events,
      top_fund,
      allContributions,
      allDirectDonations
    ] = await Promise.all([
      admin.highest_Donation(),
      admin.highest_contributor_with_name(),
      admin.total_revenue(),
      admin.total_ngo(),
      admin.total_care(),
      admin.total_money(),
      admin.total_events(),
      admin.top_fund(),
      UserContributedFundraiser.find().lean(),
      DonationMoney.find().lean()
    ]);

    const combined = [...allContributions, ...allDirectDonations];
    const monthlyBusiness = combined.reduce((acc, curr) => {
        const month = new Date(curr.contributed_at || curr.donated_at).toLocaleString('default', { month: 'short' });
        const amount = curr.amount_contributed || curr.amount_donated;
        acc[month] = (acc[month] || 0) + (amount * 0.08);
        return acc;
    }, {});

    res.status(200).json({
      highest_Donation,
      high_con_name,
      total_revenue,
      total_ngo,
      total_care,
      total_events,
      total_money,
      top_fund,
      monthlyBusiness: Object.entries(monthlyBusiness).map(([name, profit]) => ({ name, profit: profit.toFixed(2) }))
    });
  } catch (error) {
    next(error);
  }
}

const getAdminEventAnalytics = async (req, res) => {
    try {
        console.log("✓ getAdminEventAnalytics called");
        
        const [allEvents, allNgos] = await Promise.all([
            Event.find().lean(),
            NGO.find().lean()
        ]);

        console.log(`✓ Retrieved ${allEvents.length} events and ${allNgos.length} NGOs`);

        const ngoStats = allNgos.map(ngo => {
            const ngoEvents = allEvents.filter(e => String(e.ngoId) === String(ngo.ngoId));
            const totalRegs = ngoEvents.reduce((acc, e) => acc + (e.number_of_registrations || 0), 0);
            return { name: ngo.Ngoname, impact: totalRegs };
        }).sort((a, b) => b.impact - a.impact);

        const topEvent = [...allEvents].sort((a, b) => b.number_of_registrations - a.number_of_registrations)[0];

        const now = new Date();
        const ongoing = allEvents.filter(e => new Date(e.event_date).toDateString() === now.toDateString());
        const upcoming = allEvents.filter(e => new Date(e.event_date) > now);
        const completed = allEvents.filter(e => new Date(e.event_date) < now);

        const responseData = {
            success: true,
            analytics: {
                influentialNgo: ngoStats[0] || { name: "N/A", impact: 0 },
                influentialEvent: topEvent || { event_name: "N/A", number_of_registrations: 0 }
            },
            groups: { ongoing, upcoming, completed }
        };

        console.log("✓ Sending response:", JSON.stringify(responseData, null, 2));
        res.status(200).json(responseData);
    } catch (error) {
        console.error("✗ Error in getAdminEventAnalytics:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};



const getEventRegistrations = async (req, res) => {
    try {
        const { eventObjectId } = req.params; 

        const registrations = await UserRegisteredEvent.find({ eventObjectId }).lean();

        if (!registrations.length) {
            return res.status(200).json({ success: true, registrationList: [] });
        }

      
        const userIds = [...new Set(registrations.map(r => r.userId))];


        const users = await User.find({ userId: { $in: userIds } }, 'userId name Ngoname').lean();


        const registrationList = registrations.map(r => {
            const user = users.find(u => u.userId === r.userId);
            return {
                name: user ? (user.name || user.Ngoname) : "User ID: " + r.userId,
                userId: r.userId,
                registeredAt: r.registered_at || r.createdAt || new Date()
            };
        });

        res.status(200).json({ success: true, registrationList });
    } catch (error) {
        console.error("Event Registration Audit Error:", error);
        res.status(500).json({ success: false, message: "Could not retrieve participants" });
    }
};



const getAdminFundraiserAnalytics = async (req, res) => {
    try {
        const now = new Date();
        const [allNGOs, allFundraisers, allContributions, allCarehomes] = await Promise.all([
            NGO.find().lean(),
            CreatedFundraiser.find().lean(),
            UserContributedFundraiser.find().lean(),
            Carehome.find().lean()
        ]);

        const enrichedFundraisers = allFundraisers.map(f => {
            const ngo = allNGOs.find(n => Number(n.ngoId) === Number(f.ngoId));
            const home = allCarehomes.find(c => Number(c.carehomeId) === Number(f.carehomeId));
            
            return {
                ...f,
                ngoName: ngo?.Ngoname || "Unknown NGO",
                carehomeName: home?.care_home_name || "Unknown Carehome"
            };
        });

        const ngoRevenue = allNGOs.map(ngo => {
            const total = allContributions
                .filter(c => Number(c.ngoId) === Number(ngo.ngoId))
                .reduce((acc, c) => acc + c.amount_contributed, 0);
            return { name: ngo.Ngoname, total };
        }).sort((a, b) => b.total - a.total);

        res.status(200).json({
            success: true,
            analytics: {
                top3Ongoing: [...enrichedFundraisers].filter(f => new Date(f.deadline) >= now).sort((a,b) => b.amount_raised_so_far - a.amount_raised_so_far).slice(0,3),
                ngoRevenue
            },
            groups: {
                ongoing: enrichedFundraisers.filter(f => new Date(f.deadline) >= now),
                completed: enrichedFundraisers.filter(f => new Date(f.deadline) < now)
            }
        });
    } catch (error) {
        console.error("Error in getAdminFundraiserAnalytics:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


const getFundraiserDonors = async (req, res) => {
    try {
        const { fundraiserObjectId } = req.params;
        const contributions = await UserContributedFundraiser.find({ fundraiserObjectId }).sort({ contributed_at: -1 }).lean();
        const userIds = [...new Set(contributions.map(c => c.userId))];
        const users = await User.find({ userId: { $in: userIds } }, 'userId name Ngoname').lean();

        const donorList = contributions.map(c => {
            const donor = users.find(u => u.userId === c.userId);
            return {
                name: donor ? (donor.name || donor.Ngoname) : "Anonymous",
                amount: c.amount_contributed,
                date: c.contributed_at
            };
        });
        res.status(200).json({ success: true, donorList });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAdminDonationAnalytics = async (req, res) => {
    try {
        const [allCarehomes, allDonations] = await Promise.all([
            Carehome.find().lean(),
            DonationMoney.find().sort({ donated_at: -1 }).lean()
        ]);


        const carehomeImpact = allCarehomes.map(home => {
            const total = allDonations
                .filter(d => String(d.carehomeId) === String(home.carehomeId))
                .reduce((acc, d) => acc + d.amount_donated, 0);
            return { name: home.care_home_name, total, carehomeId: home.carehomeId };
        }).sort((a, b) => b.total - a.total);


        const monthlyStats = allDonations.reduce((acc, d) => {
            const month = new Date(d.donated_at).toLocaleString('default', { month: 'short' });
            acc[month] = (acc[month] || 0) + d.amount_donated;
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            analytics: {
                carehomeImpact,
                monthlyStats: Object.entries(monthlyStats).map(([name, total]) => ({ name, total })),
                platformTotal: allDonations.reduce((acc, d) => acc + d.amount_donated, 0)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


const getCarehomeDonors = async (req, res) => {
    try {
        const { carehomeId } = req.params;
        const donations = await DonationMoney.find({ carehomeId: parseInt(carehomeId) }).sort({ donated_at: -1 }).lean();
        
        const userIds = [...new Set(donations.map(d => d.userId))];
        const users = await User.find({ userId: { $in: userIds } }, 'userId name Ngoname').lean();

        const donorList = donations.map(d => {
            const donor = users.find(u => u.userId === d.userId);
            return {
                name: donor ? (donor.name || donor.Ngoname) : "Anonymous",
                amount: d.amount_donated,
                date: d.donated_at
            };
        });
        res.status(200).json({ success: true, donorList });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};






const getAllDonors = async (req, res) => {
    try {
        const donors = await User.find({}, 'userId name email mobile_number').lean();
        res.status(200).json({ success: true, donors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getDonorManagementStats = async (req, res) => {
    try {
        const { userId } = req.params;
        const [user, events, contributions, directDonations] = await Promise.all([
            User.findOne({ userId: Number(userId) }).lean(),
            UserRegisteredEvent.find({ userId: Number(userId) }).lean(),
            UserContributedFundraiser.find({ userId: Number(userId) }).lean(),
            DonationMoney.find({ userId: Number(userId) }).lean()
        ]);

        if (!user) return res.status(404).json({ success: false, message: "Donor not found" });

        const allAmounts = [
            ...contributions.map(c => c.amount_contributed), 
            ...directDonations.map(d => d.amount_donated)
        ];
        
        const highestDonation = allAmounts.length > 0 ? Math.max(...allAmounts) : 0;
        const totalImpact = allAmounts.reduce((acc, curr) => acc + curr, 0);

        res.status(200).json({
            success: true,
            stats: {
                ...user,
                highestDonation,
                totalImpact,
                eventCount: events.length,
                fundraiserCount: contributions.length,
                directCount: directDonations.length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


const deleteDonorWithEmail = async (req, res) => {
    const { userId, email, reason, name } = req.body;
    try {
        await User.deleteOne({ userId: Number(userId) });

        await transporter.sendMail({
            from: `"CareConnect Admin" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Account Deactivation Notice",
            html: `<div style="font-family: sans-serif; border: 1px solid #E0EADD; padding: 20px;">
                    <h2 style="color: #1B4332;">Hi ${name},</h2>
                    <p>Your donor account has been removed by the admin.</p>
                    <p><b>Reason:</b> ${reason}</p>
                   </div>`
        });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


const getAllNgoManagement = async (req, res) => {
    try {
        const ngos = await NGO.find({}, 'ngoId Ngoname email darpan_id').lean();
        res.status(200).json({ success: true, ngos });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


const getNgoManagementStats = async (req, res) => {
    try {
        const { ngoId } = req.params;
        const [ngo, events, fundraisers] = await Promise.all([
            NGO.findOne({ ngoId: Number(ngoId) }).lean(),
            Event.find({ ngoId: Number(ngoId) }).lean(),
            CreatedFundraiser.find({ ngoId: Number(ngoId) }).lean()
        ]);

        if (!ngo) return res.status(404).json({ success: false, message: "NGO not found" });

        // Calculate Analytics
        const highestFunding = fundraisers.length > 0 
            ? Math.max(...fundraisers.map(f => f.amount_raised_so_far)) 
            : 0;
            
        const highestRegistrations = events.length > 0 
            ? Math.max(...events.map(e => e.number_of_registrations)) 
            : 0;

        res.status(200).json({
            success: true,
            stats: {
                ...ngo,
                totalEvents: events.length,
                totalFundraisers: fundraisers.length,
                highestFunding,
                highestRegistrations
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteNgoWithEmail = async (req, res) => {
    const { ngoId, email, reason, name } = req.body;
    try {
        await NGO.deleteOne({ ngoId: Number(ngoId) });

        await transporter.sendMail({
            from: `"CareConnect Admin" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Partnership Deactivation Notice - CareConnect",
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #E0EADD;">
                    <h2 style="color: #1B4332;">Hello ${name},</h2>
                    <p>We regret to inform you that your NGO partnership has been terminated.</p>
                    <p><b>Reason for Deactivation:</b></p>
                    <p style="padding: 15px; background: #F8FAF9; border-left: 4px solid #D63031;">${reason}</p>
                </div>`
        });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


const getAllCarehomeManagement = async (req, res) => {
    try {
        const carehomes = await Carehome.find({}, 'carehomeId care_home_name email reg_number').lean();
        res.status(200).json({ success: true, carehomes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


const getCarehomeManagementStats = async (req, res) => {
    try {
        const { carehomeId } = req.params;
        const id = Number(carehomeId);

        const [home, directDonations, campaigns] = await Promise.all([
            Carehome.findOne({ carehomeId: id }).lean(),
            DonationMoney.find({ carehomeId: id }).lean(),
            CreatedFundraiser.find({ carehomeId: id }).lean()
        ]);

        if (!home) return res.status(404).json({ success: false, message: "Carehome not found" });


        const campaignNames = campaigns.map(c => c.fundraiser_name);
        const fundraiserContributions = await UserContributedFundraiser.find({ 
            fundraiser_name: { $in: campaignNames } 
        }).lean();

        const totalFundraiserMoney = fundraiserContributions.reduce((acc, c) => acc + c.amount_contributed, 0);
        const totalDirectMoney = directDonations.reduce((acc, d) => acc + d.amount_donated, 0);

        res.status(200).json({
            success: true,
            stats: {
                ...home,
                totalDirectMoney,
                totalFundraiserMoney,
                campaignCount: campaigns.length,
                totalSupporters: [...new Set([...directDonations.map(d => d.userId), ...fundraiserContributions.map(c => c.userId)])].length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


const deleteCarehomeWithEmail = async (req, res) => {
    const { carehomeId, email, reason, name } = req.body;
    try {
        await Carehome.deleteOne({ carehomeId: Number(carehomeId) });

        await transporter.sendMail({
            from: `"CareConnect Admin" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Platform De-listing Notice: Carehome Profile",
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #E0EADD;">
                    <h2 style="color: #1B4332;">Hello Management, ${name},</h2>
                    <p>Your carehome profile has been removed from our active database.</p>
                    <p><b>Official Reason:</b></p>
                    <div style="padding: 15px; background: #F8FAF9; border-left: 4px solid #D63031; color: #333;">
                        ${reason}
                    </div>
                </div>`
        });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
  Getadmin,
  getAdminEventAnalytics,
  getAdminFundraiserAnalytics,
  getFundraiserDonors,
  getCarehomeDonors,
  getAdminDonationAnalytics,
  getEventRegistrations,
  getAllDonors,
  getDonorManagementStats,
  deleteDonorWithEmail,
  deleteNgoWithEmail,
  getNgoManagementStats,
  getAllNgoManagement,
  deleteCarehomeWithEmail,
  getCarehomeManagementStats,
  getAllCarehomeManagement,
};