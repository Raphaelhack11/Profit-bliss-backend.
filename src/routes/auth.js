// src/routes/auth.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../utils/email.js";

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// --- SIGNUP ---
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, country, phone } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields required" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res.status(400).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        country,
        phone,
        isVerified: false,
        otpCode: otp,
        otpExpires,
        wallet: { create: { balance: 0 } },
      },
    });

    await sendVerificationEmail(email, otp);

    res.json({
      success: true,
      message: "Signup successful. A verification code has been sent to your email.",
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed. Try again later." });
  }
});

// --- VERIFY OTP ---
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code)
      return res.status(400).json({ error: "Email and code required" });

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

    res.json({ message: "✅ Email verified successfully!" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ error: "OTP verification failed" });
  }
});

// --- RESEND OTP ---
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.isVerified)
      return res
        .status(400)
        .json({ error: "Account already verified. Please log in." });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { otpCode: otp, otpExpires },
    });

    await sendVerificationEmail(email, otp);

    res.json({
      message: "New verification code sent to your email.",
    });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ error: "Could not resend verification code." });
  }
});

// --- LOGIN ---
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    if (!user.isVerified)
      return res.status(403).json({ error: "Please verify your email first" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

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
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;
