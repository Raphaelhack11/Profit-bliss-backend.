import express from "express"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const router = express.Router()

// Get all plans
router.get("/", async (req, res) => {
  const plans = await prisma.investmentPlan.findMany()
  res.json(plans)
})

// Seed default plans
router.post("/seed", async (req, res) => {
  const plans = [
    { name: "Basic", minAmount: 50, roi: 20, duration: 7 },
    { name: "Starter", minAmount: 100, roi: 25, duration: 7 },
    { name: "Master", minAmount: 200, roi: 30, duration: 14 },
    { name: "Elite", minAmount: 270, roi: 40, duration: 14 },
    { name: "Pro", minAmount: 350, roi: 50, duration: 21 },
    { name: "Premium", minAmount: 500, roi: 65, duration: 30 }
  ]

  for (let plan of plans) {
    await prisma.investmentPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan
    })
  }

  res.json({ message: "Plans seeded" })
})

export default router
