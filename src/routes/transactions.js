import express from "express";
import { PrismaClient } from "@prisma/client";
import authMiddleware from "../middleware/auth.js"; // adjust path if different

const prisma = new PrismaClient();
const router = express.Router();

// Create a deposit request
router.post("/deposit", authMiddleware, async (req, res) => {
  try {
    const { amount, method } = req.body;

    if (!amount || !method) {
      return res.status(400).json({ error: "Amount and method required" });
    }

    const tx = await prisma.transaction.create({
      data: {
        type: "deposit",
        amount: parseFloat(amount),
        method,
        status: "pending",
        userId: req.user.id,
      },
    });

    res.json(tx);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Deposit failed" });
  }
});

// Create a withdraw request
router.post("/withdraw", authMiddleware, async (req, res) => {
  try {
    const { amount, method, walletAddress } = req.body;

    if (!amount || !method || !walletAddress) {
      return res
        .status(400)
        .json({ error: "Amount, method, and walletAddress required" });
    }

    // Check user balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user.id },
    });

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const tx = await prisma.transaction.create({
      data: {
        type: "withdraw",
        amount: parseFloat(amount),
        method,
        address: walletAddress,
        status: "pending",
        userId: req.user.id,
      },
    });

    // Optionally, lock the funds (subtract now, restore if rejected)
    await prisma.wallet.update({
      where: { userId: req.user.id },
      data: { balance: { decrement: parseFloat(amount) } },
    });

    res.json(tx);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Withdraw failed" });
  }
});

// Get all user transactions
router.get("/", authMiddleware, async (req, res) => {
  try {
    const txs = await prisma.transaction.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(txs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

export default router;
