import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken as authMiddleware } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// Get all plans
router.get("/", async (req, res) => {
  try {
    const plans = await prisma.investmentPlan.findMany({
      orderBy: { createdAt: "asc" }, // 👈 optional: makes plans show in order
    });
    res.json(plans);
  } catch (err) {
    console.error("Error fetching plans:", err);
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

// Create new plan (later: restrict to admin only)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, minAmount, roi, duration } = req.body;

    // basic validation
    if (!name || !minAmount || !roi || !duration) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const plan = await prisma.investmentPlan.create({
      data: { name, minAmount, roi, duration },
    });
    res.json(plan);
  } catch (err) {
    console.error("Error creating plan:", err);
    res.status(500).json({ error: "Failed to create plan" });
  }
});

// Update a plan
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, minAmount, roi, duration } = req.body;

    const plan = await prisma.investmentPlan.update({
      where: { id },
      data: { name, minAmount, roi, duration },
    });

    res.json(plan);
  } catch (err) {
    console.error("Error updating plan:", err);
    res.status(500).json({ error: "Failed to update plan" });
  }
});

// Delete a plan
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.investmentPlan.delete({ where: { id } });
    res.json({ message: "Plan deleted" });
  } catch (err) {
    console.error("Error deleting plan:", err);
    res.status(500).json({ error: "Failed to delete plan" });
  }
});

export default router;
