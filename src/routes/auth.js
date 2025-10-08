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

/* ==============================================================
   SIGNUP / REGISTER
================================================================*/
router.post(["/register", "/signup"], async (req, res) => {
  try {
    const { name, email, password, country, phone } = req.body;
    console.log("➡️ Signup attempt:", email);

    if (!name || !email || !password) {
      console.log("⚠️ Missing required fields");
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

    console.log("🌀 Creating user in database...");

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

    console.log("✅ User created:", user.email);

    // Send OTP via SendGrid
    console.log("📧 Sending verification email...");
    await sendVerificationEmail(user.email, otp);
    console.log("✅ Verification email sent!");

    res.json({
      message: "Signup successful. Verification code sent to your email 📩",
    });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

/* ==============================================================
   VERIFY EMAIL (OTP)
================================================================*/
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, code } = req.body;
    console.log("➡️ OTP verification attempt for:", email, "Code:", code);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log("❌ User not found for OTP verification");
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isVerified) {
      console.log("✅ Already verified:", email);
      return res.json({ message: "Account already verified ✅" });
    }

    if (user.otpCode !== code) {
      console.log("❌ Invalid code for:", email);
      return res.status(400).json({ error: "Invalid verification code" });
    }

    if (user.otpExpires < new Date()) {
      console.log("❌ OTP expired for:", email);
      return res.status(400).json({ error: "Verification code expired" });
    }

    await prisma.user.update({
      where: { email },
      data: { isVerified: true, otpCode: null, otpExpires: null },
    });

    console.log("✅ Email verified successfully for:", email);
    res.json({ message: "✅ Email verified successfully!" });
  } catch (err) {
    console.error("❌ OTP verification error:", err);
    res.status(500).json({ error: "OTP verification failed" });
  }
});

/* ==============================================================
   RESEND VERIFICATION CODE
================================================================*/
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    console.log("➡️ Resend OTP requested for:", email);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.isVerified) {
      return res.json({ message: "Account already verified ✅" });
    }

    const newOTP = generateOTP();
    const newExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { otpCode: newOTP, otpExpires: newExpiry },
    });

    console.log("📧 Resending verification email...");
    await sendVerificationEmail(user.email, newOTP);
    console.log("✅ Verification email re-sent!");

    res.json({ message: "A new verification code has been sent to your email 📩" });
  } catch (err) {
    console.error("❌ Resend OTP error:", err);
    res.status(500).json({ error: "Failed to resend verification email" });
  }
});

/* ==============================================================
   LOGIN
================================================================*/
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("➡️ Login attempt:", email);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      console.log("❌ Invalid password for:", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isVerified) {
      console.log("⚠️ Unverified user tried to login:", email);
      return res.status(403).json({ error: "Please verify your email first" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log("✅ Login successful:", email);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

/* ==============================================================
   CHANGE PASSWORD
================================================================*/
router.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const { current, newPassword } = req.body;
    console.log("➡️ Change password attempt for user:", req.user.id);

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

    console.log("✅ Password changed for:", user.email);
    res.json({ message: "Password updated successfully ✅" });
  } catch (err) {
    console.error("❌ Change password error:", err);
    res.status(500).json({ error: "Password change failed" });
  }
});

export default router;
