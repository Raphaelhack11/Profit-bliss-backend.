import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticateToken } from "../middleware/auth.js";
import { sendVerificationEmail } from "../utils/email.js";

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// --- Helper: generate 6-digit OTP ---
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// --- Register / Signup ---
router.post(["/register", "/signup"], async (req, res) => {
  try {
    const { name, email, password, country, phone } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

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

    // Send OTP email
    await sendVerificationEmail(user.email, otp);

    res.json({ message: "Signup successful. Verification code sent to email." });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(400).json({ error: "Signup failed" });
  }
});

// --- Verify OTP ---
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.isVerified) {
      return res.json({ message: "User already verified" });
    }

    if (user.otpCode !== code) {
      return res.status(400).json({ error: "Invalid code" });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({ error: "Code expired" });
    }

    await prisma.user.update({
      where: { email },
      data: { isVerified: true, otpCode: null, otpExpires: null },
    });

    res.json({ message: "✅ Email verified successfully" });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

// --- Login ---
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(403).json({ error: "Please verify your email first" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// --- Change Password ---
router.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const { current, new: newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(current, user.password);
    if (!valid) return res.status(400).json({ error: "Current password incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Password change failed" });
  }
});

export default router;
