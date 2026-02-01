const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "chinnikarth22@gmail.com",
    pass: "jfou vgpy hjtr ltqb "
  }
});

const DEV_EMAILS = [
  "karthikbabu.c23@iiits.in",
  "thrivikramateja.t23@iiits.in",
  "nitishkumarreddy.b23@iiits.in",
  "chandoovardhan.k23@iiits.in",
  "venkatadheeraj.c23@iiits.in",
];

const sendErrorEmail = async ({ message, stack, route, method }) => {
  try {
    await transporter.sendMail({
      from: '"CareConnect Errors" <errors@careconnect.com>',
      to: DEV_EMAILS.join(","),
      subject: " CareConnect Backend Error",
      html: `
        <div style="font-family:Arial;padding:20px">
          <h2 style="color:#dc2626">Backend Error</h2>
          <p><b>Route:</b> ${method} ${route}</p>
          <p><b>Message:</b> ${message}</p>
          <pre style="background:#f3f4f6;padding:10px">${stack}</pre>
        </div>
      `
    });
  } catch (err) {
    console.error("Error email failed:", err);
  }
};

module.exports = sendErrorEmail;
