import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken as authMiddleware } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// Get all plans
router.get("/", async (req, res) => {
  try {
    const plans = await prisma.investmentPlan.findMany();
    res.json(plans);
  } catch (err) {
    console.error("Error fetching plans:", err);
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

// Protected: create new plan (only for admins later)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, minAmount, roi, duration } = req.body;
    const plan = await prisma.investmentPlan.create({
      data: { name, minAmount, roi, duration },
    });
    res.json(plan);
  } catch (err) {
    console.error("Error creating plan:", err);
    res.status(500).json({ error: "Failed to create plan" });
  }
});

export default router;
