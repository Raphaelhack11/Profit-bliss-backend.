// src/utils/email.js
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send verification email with OTP code
 */
export async function sendVerificationEmail(to, code) {
  const msg = {
    to,
    from: "equigrowinc@gmail.com", // must match your verified sender in SendGrid
    subject: "Your Verification Code",
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Verify your email</h2>
        <p>Use the following code to verify your account:</p>
        <h1 style="color: #2f8bfd;">${code}</h1>
        <p>This code expires in <strong>10 minutes</strong>.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Verification email sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending email:", err.response?.body || err);
    throw new Error("Email sending failed");
  }
  }
