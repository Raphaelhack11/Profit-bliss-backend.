import express from "express";
import prisma from "../prismaClient.js";
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
    try {
      const { id } = req.params;

      const tx = await prisma.transaction.update({
        where: { id }, // ✅ string, not parseInt
        data: { status: "approved" },
      });

      await prisma.wallet.update({
        where: { userId: tx.userId },
        data: { balance: { increment: tx.amount } },
      });

      res.json({ message: "Deposit approved ✅", tx });
    } catch (err) {
      console.error("Approve deposit error:", err);
      res.status(500).json({ error: "Failed to approve deposit" });
    }
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
    try {
      const { id } = req.params;

      const tx = await prisma.transaction.update({
        where: { id }, // ✅ string, not parseInt
        data: { status: "rejected" },
      });

      res.json({ message: "Deposit rejected ❌", tx });
    } catch (err) {
      console.error("Reject deposit error:", err);
      res.status(500).json({ error: "Failed to reject deposit" });
    }
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
    try {
      const withdrawals = await prisma.transaction.findMany({
        where: { type: "withdraw" },
        include: { user: true },
        orderBy: { createdAt: "desc" },
      });
      res.json(withdrawals);
    } catch (err) {
      console.error("Get withdrawals error:", err);
      res.status(500).json({ error: "Failed to fetch withdrawals" });
    }
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
    try {
      const { id } = req.params;

      const tx = await prisma.transaction.update({
        where: { id }, // ✅ string, not parseInt
        data: { status: "approved" },
      });

      res.json({ message: "Withdrawal approved ✅", tx });
    } catch (err) {
      console.error("Approve withdrawal error:", err);
      res.status(500).json({ error: "Failed to approve withdrawal" });
    }
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
    try {
      const { id } = req.params;

      const tx = await prisma.transaction.update({
        where: { id }, // ✅ string, not parseInt
        data: { status: "rejected" },
      });

      await prisma.wallet.update({
        where: { userId: tx.userId },
        data: { balance: { increment: tx.amount } },
      });

      res.json({ message: "Withdrawal rejected & refunded ❌💰", tx });
    } catch (err) {
      console.error("Reject withdrawal error:", err);
      res.status(500).json({ error: "Failed to reject withdrawal" });
    }
  }
);

export default router;
