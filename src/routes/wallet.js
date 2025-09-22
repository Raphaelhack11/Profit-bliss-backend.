import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken as authMiddleware } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// Get wallet balance
router.get("/", authMiddleware, async (req, res) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user.id },
    });
    res.json(wallet || { balance: 0 });
  } catch (err) {
    console.error("Wallet fetch error:", err);
    res.status(500).json({ error: "Failed to fetch wallet" });
  }
});

export default router;
