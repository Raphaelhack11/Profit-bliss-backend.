// src/routes/wallet.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken as authMiddleware } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// Get wallet
router.get("/", authMiddleware, async (req, res) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user.id },
    });

    if (!wallet) {
      return res.json({ id: null, balance: 0 });
    }

    res.json({
      id: wallet.id,
      balance: wallet.balance,
    });
  } catch (err) {
    console.error("Wallet fetch error:", err);
    res.status(500).json({ error: "Failed to fetch wallet" });
  }
});

export default router;
