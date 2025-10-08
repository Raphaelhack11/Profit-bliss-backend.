// src/utils/email.js
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Sends a verification code email
 * @param {string} to - recipient email
 * @param {string} code - the OTP code
 */
export async function sendVerificationEmail(to, code) {
  const msg = {
    to,
    from: "equigrowinc@gmail.com", // must be a verified sender in SendGrid
    subject: "Your Equi Grow Verification Code",
    text: `Your verification code is ${code}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Profit Bliss Verification</h2>
        <p>Your one-time verification code is:</p>
        <h1 style="color: #4F46E5;">${code}</h1>
        <p>This code expires in 10 minutes.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Verification email sent to ${to}`);
  } catch (err) {
    console.error("❌ SendGrid email error:", err.response?.body || err);
    throw new Error("Failed to send verification email");
  }
}
