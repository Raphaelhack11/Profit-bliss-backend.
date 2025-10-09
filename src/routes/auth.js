import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticateToken } from "../middleware/auth.js";
import { sendVerificationEmail } from "../utils/email.js";

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// --- Helper: Generate 6-digit OTP ---
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// --- REGISTER / SIGNUP ---
router.post(["/register", "/signup"], async (req, res) => {
  try {
    const { name, email, password, country, phone } = req.body;

    console.log("📨 Incoming signup request:", req.body);

    if (!name || !email || !password) {
      console.log("❌ Missing fields");
      return res.status(400).json({ error: "All fields are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log("⚠️ Email already registered:", email);
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        country,
        phone,
        role: "user",
        isVerified: false,
        otpCode: otp,
        otpExpires: otpExpiry,
        wallet: { create: { balance: 0 } },
      },
    });

    console.log("✅ User created:", user.email, "Sending OTP:", otp);

    try {
      await sendVerificationEmail(user.email, otp);
      console.log("✅ Verification email sent successfully");
    } catch (emailErr) {
      console.error("❌ Email send failed:", emailErr);
      return res
        .status(500)
        .json({ error: "Could not send verification email. Please try again." });
    }

    res.json({
      message: "Signup successful. Verification code sent to your email.",
    });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ error: "Signup failed. Try again later." });
  }
});

// --- VERIFY OTP ---
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, code } = req.body;

    console.log("🔍 Verifying OTP for:", email, "Code:", code);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.isVerified)
      return res.json({ message: "Account already verified ✅" });

    if (user.otpCode !== code)
      return res.status(400).json({ error: "Invalid verification code" });

    if (user.otpExpires < new Date())
      return res.status(400).json({ error: "Verification code expired" });

    await prisma.user.update({
      where: { email },
      data: { isVerified: true, otpCode: null, otpExpires: null },
    });

    console.log("✅ Email verified for:", email);

    res.json({ message: "✅ Email verified successfully!" });
  } catch (err) {
    console.error("❌ Verify OTP error:", err);
    res.status(500).json({ error: "OTP verification failed" });
  }
});

// --- RESEND VERIFICATION CODE ---
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    console.log("🔁 Resending OTP to:", email);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.isVerified)
      return res.json({ message: "Account already verified ✅" });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { otpCode: otp, otpExpires: otpExpiry },
    });

    try {
      await sendVerificationEmail(email, otp);
      console.log("✅ Verification email re-sent");
      res.json({ message: "Verification code resent successfully!" });
    } catch (emailErr) {
      console.error("❌ Email resend failed:", emailErr);
      res.status(500).json({ error: "Failed to resend verification email." });
    }
  } catch (err) {
    console.error("❌ Resend OTP error:", err);
    res.status(500).json({ error: "Could not resend code." });
  }
});

// --- LOGIN ---
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Login attempt:", email);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log("❌ Invalid email");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      console.log("❌ Wrong password");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isVerified) {
      console.log("⚠️ Email not verified");
      return res
        .status(403)
        .json({ error: "Please verify your email before logging in." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log("✅ Login successful for:", email);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Login failed. Try again." });
  }
});

// --- CHANGE PASSWORD ---
router.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const { current, newPassword } = req.body;

    if (!current || !newPassword) {
      return res.status(400).json({ error: "Both fields are required" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(current, user.password);
    if (!valid)
      return res.status(400).json({ error: "Current password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    res.json({ message: "Password updated successfully ✅" });
  } catch (err) {
    console.error("❌ Change password error:", err);
    res.status(500).json({ error: "Password change failed" });
  }
});

/* ==============================================================
   DEBUG ROUTE (TEMPORARY)
================================================================*/
router.get("/debug", async (req, res) => {
  try {
    const checks = {};

    // Check environment variables
    checks.env = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      SENDGRID_API_KEY: !!process.env.SENDGRID_API_KEY,
    };

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = "✅ Connected";
    } catch (dbErr) {
      checks.database = "❌ Failed: " + dbErr.message;
    }

    // Check email sending
    try {
      if (!process.env.SENDGRID_API_KEY) throw new Error("Missing SENDGRID_API_KEY");
      checks.sendgrid = "✅ Key present";
    } catch (sgErr) {
      checks.sendgrid = "❌ Error: " + sgErr.message;
    }

    res.json({ message: "✅ Debug info", checks });
  } catch (err) {
    console.error("❌ Debug route error:", err);
    res.status(500).json({ error: "Debug route failed" });
  }
});

export default router;
