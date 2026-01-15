const nodemailer = require('nodemailer');

// 1. Generate a 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// 2. Send the Email
const sendOTPEmail = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'chinnikarth22@gmail.com', // Replace with your Gmail
            pass: 'jfou vgpy hjtr ltqb '     // Replace with Google App Password
        }
    });

    const mailOptions = {
        from: '"CareConnect Security" <security@careconnect.com>',
        to: email,
        subject: 'CareConnect: Your Security Verification Code',
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
        `
    };

    return await transporter.sendMail(mailOptions);
};

module.exports = { generateOTP, sendOTPEmail };