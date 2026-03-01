const PDFDocument = require('pdfkit');
const { DonationMoney, Carehome } = require('../models/carehome.model');
const { UserContributedFundraiser, UserRegisteredEvent } = require('../models/user.model');
const { NGO } = require('../models/NGO.model');
const {User} = require('../models/user.model');

const downloadImpactReceipt = async (req, res, next) => {
    const { type, id } = req.params;

    try {
        // const donor = await User.findOne({ userId: req.user.userId }).lean();
        // const donorName = donor ? donor.name : "Valued Donor";
        console.log(req.user);
        const donorName = req.user.name || "Valued Donor";
        let rData = { beneficiary: "", title: "", amount: 0, date: null, extra: "", typeLabel: "" };

        // 1. DATA FETCHING (Using your specific schemas)
        if (type === 'direct') {
            const d = await DonationMoney.findById(id).lean();
            const h = await Carehome.findOne({ carehomeId: d.carehomeId }).lean();
            rData = { title: "Direct Care Donation", beneficiary: h?.care_home_name, amount: d.amount_donated, date: d.donated_at, extra: `Reg: ${h?.reg_number || 'N/A'}`, typeLabel: "Care Institution" };
        } else if (type === 'fundraiser') {
            const c = await UserContributedFundraiser.findById(id).lean();
            const n = await NGO.findOne({ ngoId: c.ngoId }).lean();
            rData = { title: "Fundraiser Receipt", beneficiary: n?.Ngoname, amount: c.amount_contributed, date: c.contributed_at, extra: `Campaign: ${c.fundraiser_name}`, typeLabel: "Non-Profit Partner" };
        } else if (type === 'event') {
            const e = await UserRegisteredEvent.findById(id).lean();
            const n = await NGO.findOne({ ngoId: e.ngoId }).lean();
            rData = { title: "Participation Certificate", beneficiary: n?.Ngoname, amount: 0, date: e.event_date, extra: `Event: ${e.event_name}`, typeLabel: "Community Partner" };
        }

        if (!rData.beneficiary) return res.status(404).send("Record not found");

        // 2. INITIALIZE PDF
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=CareConnect_Receipt.pdf`);
        doc.pipe(res);

        // --- PREMIUM HEADER ---
        doc.rect(0, 0, 612, 130).fill('#1B4332'); // Forest Green
        
        // Logo: Care (White) Connect (Mint Green)
        doc.fillColor('#FFFFFF').fontSize(30).font('Helvetica-Bold').text('Care', 60, 50, { continued: true })
           .fillColor('#10b981').text('Connect');
        
        doc.fillColor('#D8F3DC').fontSize(10).font('Helvetica').text('OFFICIAL IMPACT DOCUMENT', 60, 85, { characterSpacing: 1.5 });

        // --- TRANSACTION METADATA (Right Aligned) ---
        const safeId = id.toString().toUpperCase();
        doc.fillColor('#333333').fontSize(9).font('Helvetica-Bold').text('DOCUMENT ID', 400, 160);
        doc.font('Helvetica').text(`#${safeId}`, 400, 172);
        
        doc.font('Helvetica-Bold').text('DATE OF ACTION', 400, 200);
        doc.font('Helvetica').text(new Date(rData.date).toDateString(), 400, 212);

        // --- MAIN BODY ---
        doc.fillColor('#1B4332').fontSize(22).font('Helvetica-Bold').text(rData.title, 60, 160);
        
        doc.moveDown(1.5);
        doc.fillColor('#6B705C').fontSize(10).font('Helvetica').text('THIS IS TO CERTIFY A CONTRIBUTION FROM:');
        doc.fillColor('#333333').fontSize(14).font('Helvetica-Bold').text(donorName);
        
        doc.moveDown(1.5);
        doc.fillColor('#6B705C').fontSize(10).font('Helvetica').text('TO THE BENEFICIARY:');
        doc.fillColor('#1B4332').fontSize(18).font('Helvetica-Bold').text(rData.beneficiary);
        doc.fillColor('#10b981').fontSize(10).font('Helvetica').text(rData.typeLabel);
        doc.fillColor('#333333').fontSize(11).font('Helvetica-Oblique').text(`"${rData.extra}"`);

        // --- IMPACT CALCULATION BOX ---
        if (rData.amount > 0) {
            const fee = rData.amount * 0.08;
            const net = rData.amount - fee;

            doc.moveDown(2);
            const boxY = doc.y;
            doc.rect(60, boxY, 492, 100).fill('#F4F7F5'); // Light Sage Background
            doc.rect(60, boxY, 492, 100).stroke('#E0EADD');

            doc.fillColor('#333333').fontSize(11).font('Helvetica').text('Gross Contribution', 80, boxY + 20);
            doc.text(`INR ${rData.amount.toLocaleString()}`, 400, boxY + 20, { align: 'right', width: 130 });

            doc.fillColor('#D63031').text('Platform Commission (8%)', 80, boxY + 40);
            doc.text(`- INR ${fee.toFixed(2)}`, 400, boxY + 40, { align: 'right', width: 130 });

            doc.strokeColor('#E0EADD').moveTo(80, boxY + 65).lineTo(530, boxY + 65).stroke();

            doc.fillColor('#1B4332').fontSize(14).font('Helvetica-Bold').text('Net Community Impact', 80, boxY + 75);
            doc.text(`INR ${net.toLocaleString()}`, 380, boxY + 75, { align: 'right', width: 150 });
        } else {
            doc.moveDown(3);
            doc.fillColor('#10b981').fontSize(14).font('Helvetica-Bold').text('STATUS: PARTICIPATION VERIFIED', { characterSpacing: 1 });
        }

        // --- THANK YOU MESSAGE ---
        doc.moveDown(4);
        doc.fillColor('#1B4332').fontSize(14).font('Helvetica-Bold').text('A Note from CareConnect,');
        doc.moveDown(0.5);
        doc.fillColor('#333333').fontSize(11).font('Helvetica-Oblique')
           .text('Your kindness is the heartbeat of this platform. Because of you, a carehome is warmer, an NGO is stronger, and our community is better. Thank you for being the change.', { width: 450, lineGap: 4 });

        // --- FOOTER ---
        doc.fontSize(8).fillColor('#A3B18A').font('Helvetica').text('This is a computer-generated document secured by CareConnect Administrative Terminal.', 50, 780, { align: 'center', width: 512 });

        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).send("Error generating PDF");
    }
};

module.exports = { downloadImpactReceipt };