import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Get all plans
router.get("/", async (req, res) => {
  try {
    const plans = await prisma.investmentPlan.findMany();
    res.json(plans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

// Create a new plan (admin only ideally)
router.post("/", async (req, res) => {
  try {
    const { name, description, minAmount, roi, duration } = req.body;
    const plan = await prisma.investmentPlan.create({
      data: { name, description, minAmount, roi, duration },
    });
    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create plan" });
  }
});

export default router;
