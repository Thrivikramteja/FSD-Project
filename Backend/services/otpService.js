const nodemailer = require("nodemailer");

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "chinnikarth22@gmail.com", 
    pass: "jfou vgpy hjtr ltqb",      
  },
});

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: '"CareConnect Security" <security@careconnect.com>',
    to: email,
    subject: "CareConnect: Your Security Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e1e1e1;">
          <h2 style="color: #059669;">CareConnect Security</h2>
          <p>To finalize your login, please enter the following code:</p>
          <div style="font-size: 32px; font-weight: bold; color: #047857; letter-spacing: 5px; margin: 20px 0;">
              ${otp}
          </div>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

const sendAcceptedEmail = async (email, userName, jobTitle) => {
  const mailOptions = {
    from: '"CareConnect" <no-reply@careconnect.com>',
    to: email,
    subject: "Your Job Application Has Been Accepted 🎉",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e1e1e1;">
        <h2 style="color: #059669;">Congratulations, ${userName}!</h2>
        <p>Your application for <strong>${jobTitle}</strong> has been <strong>accepted</strong>.</p>
        <p>We will contact you soon with the next steps.</p>
        <p>Thank you for applying to CareConnect.</p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

const sendRejectedEmail = async (email, userName, jobTitle) => {
  const mailOptions = {
    from: '"CareConnect" <no-reply@careconnect.com>',
    to: email,
    subject: "Your Job Application Status Update",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e1e1e1;">
        <h2 style="color: #ef4444;">Hello, ${userName}</h2>
        <p>Thank you for applying for <strong>${jobTitle}</strong>.</p>
        <p>We regret to inform you that your application has been <strong>rejected</strong>.</p>
        <p>We encourage you to apply for other openings in the future.</p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendAcceptedEmail,
  sendRejectedEmail,
};
