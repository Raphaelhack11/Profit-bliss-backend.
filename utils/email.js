// sendgridTest.js
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: "yourpersonalemail@example.com",
  from: process.env.SENDER_EMAIL,
  subject: "SendGrid Test Email",
  text: "Hello, this is a test email from SendGrid!",
  html: "<strong>Hello, this is a test email from SendGrid!</strong>",
};

sgMail
  .send(msg)
  .then(() => console.log("✅ Email sent"))
  .catch((err) => console.error("❌ Error:", err));
