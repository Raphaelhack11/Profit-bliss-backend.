import sgMail from "@sendgrid/mail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL || "profitblissmail@gmail.com";

sgMail.setApiKey(SENDGRID_API_KEY);

export const sendVerificationEmail = async (email, otp) => {
  const msg = {
    to: email,
    from: SENDER_EMAIL,
    subject: "Verify your Equi Grow Account",
    html: `
      <div style="font-family:sans-serif; line-height:1.6; color:#333">
        <h2>Welcome to Equi Grow!</h2>
        <p>Your 6-digit verification code is:</p>
        <h1 style="letter-spacing:3px; color:#007BFF">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Verification email sent to ${email}`);
  } catch (error) {
    console.error("❌ Failed to send email:", error.response?.body || error.message);
    throw new Error("Could not send verification email");
  }
};
