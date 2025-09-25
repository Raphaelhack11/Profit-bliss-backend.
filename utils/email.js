import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendVerificationEmail(email, code) {
  const msg = {
    to: email,
    from: process.env.SENDGRID_SENDER, // must be verified in SendGrid
    subject: "Your Verification Code",
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your verification code is:</p>
           <h2>${code}</h2>
           <p>It expires in 10 minutes.</p>`,
  };

  try {
    await sgMail.send(msg);
    console.log("✅ Verification email sent to", email);
  } catch (err) {
    console.error("❌ SendGrid error:", err.response?.body || err.message);
    throw new Error("Failed to send email");
  }
}
