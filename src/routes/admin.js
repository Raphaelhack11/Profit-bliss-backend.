// backend/routes/adminRoutes.js
import express from "express";
import prisma from "../prismaClient.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Helper to safely parse ID (works for String or Int PKs)
const parseId = (id) => (isNaN(id) ? id : parseInt(id));

/* ============================
   DEPOSITS
============================ */
router.get("/deposits", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const deposits = await prisma.transaction.findMany({
      where: { type: "deposit" },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(deposits);
  } catch (err) {
    console.error("Get deposits error:", err);
    res.status(500).json({ error: "Failed to fetch deposits" });
  }
});

router.post("/deposits/:id/approve", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const txId = parseId(req.params.id);

    const tx = await prisma.transaction.update({
      where: { id: txId },
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
});

router.post("/deposits/:id/reject", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const txId = parseId(req.params.id);

    const tx = await prisma.transaction.update({
      where: { id: txId },
      data: { status: "rejected" },
    });

    res.json({ message: "Deposit rejected ❌", tx });
  } catch (err) {
    console.error("Reject deposit error:", err);
    res.status(500).json({ error: "Failed to reject deposit" });
  }
});

/* ============================
   WITHDRAWALS
============================ */
router.get("/withdrawals", authenticateToken, requireAdmin, async (req, res) => {
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
});

router.post("/withdrawals/:id/approve", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const txId = parseId(req.params.id);

    const tx = await prisma.transaction.update({
      where: { id: txId },
      data: { status: "approved" },
    });

    res.json({ message: "Withdrawal approved ✅", tx });
  } catch (err) {
    console.error("Approve withdrawal error:", err);
    res.status(500).json({ error: "Failed to approve withdrawal" });
  }
});

router.post("/withdrawals/:id/reject", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const txId = parseId(req.params.id);

    const tx = await prisma.transaction.update({
      where: { id: txId },
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
});

/* ============================
   INVESTMENT PLANS (CRUD)
============================ */
// Get all plans
router.get("/plans", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const plans = await prisma.investmentPlan.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(plans);
  } catch (err) {
    console.error("Get plans error:", err);
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

// Create new plan
router.post("/plans", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, minAmount, roi, duration } = req.body;

    const newPlan = await prisma.investmentPlan.create({
      data: {
        name,
        description,
        minAmount: parseFloat(minAmount),
        roi: parseFloat(roi),
        duration: parseInt(duration),
      },
    });

    res.json({ message: "Plan created ✅", newPlan });
  } catch (err) {
    console.error("Create plan error:", err);
    res.status(500).json({ error: "Failed to create plan" });
  }
});

// Update plan
router.put("/plans/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const planId = parseId(req.params.id);
    const { name, description, minAmount, roi, duration } = req.body;

    const updatedPlan = await prisma.investmentPlan.update({
      where: { id: planId },
      data: {
        name,
        description,
        minAmount: parseFloat(minAmount),
        roi: parseFloat(roi),
        duration: parseInt(duration),
      },
    });

    res.json({ message: "Plan updated ✅", updatedPlan });
  } catch (err) {
    console.error("Update plan error:", err);
    res.status(500).json({ error: "Failed to update plan" });
  }
});

// Delete plan
router.delete("/plans/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const planId = parseId(req.params.id);

    await prisma.investmentPlan.delete({
      where: { id: planId },
    });

    res.json({ message: "Plan deleted ❌" });
  } catch (err) {
    console.error("Delete plan error:", err);
    res.status(500).json({ error: "Failed to delete plan" });
  }
});

export default router;
