import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: "ezunraphael53@gmail.com", // 👈 where you want to test
  from: process.env.FROM_EMAIL, // 👈 must be the verified sender
  subject: "Test Email from ProfitBliss",
  text: "Hello, this is a test email!",
  html: "<strong>Hello, this is a test email!</strong>",
};

sgMail
  .send(msg)
  .then(() => console.log("✅ Test email sent"))
  .catch((error) => console.error("❌ Error sending email:", error));
