import express from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const router = express.Router();
const prisma = new PrismaClient();

const router = express.Router();

// Create a deposit request
router.post("/deposit", authMiddleware, async (req, res) => {
  try {
    const { amount, method } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // create a transaction
    const tx = await prisma.transaction.create({
      data: {
        type: "deposit",
        amount,
        method,
        status: "pending",
        userId: req.user.id,
      },
    });

    res.json({ success: true, transaction: tx });
  } catch (err) {
    console.error("Deposit error:", err);
    res.status(500).json({ error: "Deposit failed" });
  }
});

// Create a withdraw request
router.post("/withdraw", authMiddleware, async (req, res) => {
  try {
    const { amount, method, walletAddress } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // check wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user.id },
    });

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // subtract from wallet balance immediately
    await prisma.wallet.update({
      where: { userId: req.user.id },
      data: { balance: { decrement: amount } },
    });

    // create transaction
    const tx = await prisma.transaction.create({
      data: {
        type: "withdraw",
        amount,
        method,
        walletAddress,
        status: "pending",
        userId: req.user.id,
      },
    });

    res.json({ success: true, transaction: tx });
  } catch (err) {
    console.error("Withdraw error:", err);
    res.status(500).json({ error: "Withdraw failed" });
  }
});

// Get all transactions for logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const txs = await prisma.transaction.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    res.json(txs);
  } catch (err) {
    console.error("Fetch transactions error:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

export default router;
