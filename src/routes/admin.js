import express from "express";
import prisma from "../lib/prisma.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// ====================
// Get all deposits
// ====================
router.get("/deposits", authenticateToken, requireAdmin, async (req, res) => {
  const deposits = await prisma.transaction.findMany({
    where: { type: "deposit" },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(deposits);
});

// ====================
// Approve deposit
// ====================
router.post(
  "/deposits/:id/approve",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const { id } = req.params;
    const tx = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: { status: "approved" },
    });

    await prisma.wallet.update({
      where: { userId: tx.userId },
      data: { balance: { increment: tx.amount } },
    });

    res.json({ message: "Deposit approved ✅", tx });
  }
);

// ====================
// Reject deposit
// ====================
router.post(
  "/deposits/:id/reject",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const { id } = req.params;
    const tx = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: { status: "rejected" },
    });
    res.json({ message: "Deposit rejected ❌", tx });
  }
);

// ====================
// Get all withdrawals
// ====================
router.get(
  "/withdrawals",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const withdrawals = await prisma.transaction.findMany({
      where: { type: "withdraw" },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(withdrawals);
  }
);

// ====================
// Approve withdrawal
// ====================
router.post(
  "/withdrawals/:id/approve",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const { id } = req.params;
    const tx = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: { status: "approved" },
    });
    res.json({ message: "Withdrawal approved ✅", tx });
  }
);

// ====================
// Reject withdrawal (refund user)
// ====================
router.post(
  "/withdrawals/:id/reject",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const { id } = req.params;
    const tx = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: { status: "rejected" },
    });

    await prisma.wallet.update({
      where: { userId: tx.userId },
      data: { balance: { increment: tx.amount } },
    });

    res.json({ message: "Withdrawal rejected & refunded ❌💰", tx });
  }
);

export default router;
