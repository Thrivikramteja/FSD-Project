const EMAILJS_URL = "https://api.emailjs.com/api/v1.0/email/send";

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendEmail = async (email, subject, html) => {
  const response = await fetch(EMAILJS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY,

      template_params: {
        to_email: email,
        subject: subject,
        html_content: html,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `EmailJS request failed: ${response.status} ${errorText}`
    );
  }

  return await response.text();
};

const sendOTPEmail = async (email, otp) => {
  const subject = "CareConnect: Your Security Verification Code";

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e1e1e1;">
        <h2 style="color: #059669;">CareConnect Security</h2>

        <p>To finalize your login, please enter the following code:</p>

        <div style="font-size: 32px; font-weight: bold; color: #047857; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
        </div>

        <p>This code will expire in 5 minutes.</p>

        <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;

  return await sendEmail(email, subject, html);
};

const sendAcceptedEmail = async (email, userName, jobTitle) => {
  const subject = "Your Job Application Has Been Accepted 🎉";

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e1e1e1;">
      <h2 style="color: #059669;">Congratulations, ${userName}!</h2>

      <p>
        Your application for <strong>${jobTitle}</strong>
        has been <strong>accepted</strong>.
      </p>

      <p>We will contact you soon with the next steps.</p>

      <p>Thank you for applying to CareConnect.</p>
    </div>
  `;

  return await sendEmail(email, subject, html);
};

const sendRejectedEmail = async (email, userName, jobTitle) => {
  const subject = "Your Job Application Status Update";

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e1e1e1;">
      <h2 style="color: #ef4444;">Hello, ${userName}</h2>

      <p>
        Thank you for applying for <strong>${jobTitle}</strong>.
      </p>

      <p>
        We regret to inform you that your application has been
        <strong>rejected</strong>.
      </p>

      <p>
        We encourage you to apply for other openings in the future.
      </p>
    </div>
  `;

  return await sendEmail(email, subject, html);
};

const sendCorporateDonationEmail = async (
  email,
  companyName,
  ngoName,
  amount
) => {
  const subject = `Donation Confirmation - ${companyName} x ${ngoName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">

        <h2 style="color: #059669;">Contribution Received</h2>

        <p>
          Dear <strong>${companyName} Team</strong>,
        </p>

        <p>
          Thank you for your generous contribution of
          <strong>₹${amount}</strong>
          to <strong>${ngoName}</strong> via CareConnect.
        </p>

        <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #059669; margin: 20px 0;">

            <p style="margin: 0; font-size: 14px; color: #064e3b;">

                <strong>Tax Benefit Notice:</strong>
                This donation is eligible for tax deduction under Section 80G.

                Your formal certificate will be processed and sent to this
                email address within 7-10 business days.

            </p>

        </div>

        <p>
          Your support helps us bridge the gap and create a lasting impact.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

        <p style="font-size: 12px; color: #666;">
          This is an automated confirmation from the CareConnect B2B Portal.
        </p>

    </div>
  `;

  return await sendEmail(email, subject, html);
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendAcceptedEmail,
  sendRejectedEmail,
  sendCorporateDonationEmail,
};