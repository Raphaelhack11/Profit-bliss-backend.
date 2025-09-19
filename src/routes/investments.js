import express from "express"
import { PrismaClient } from "@prisma/client"
import { authenticateToken } from "../middleware/auth.js"

const prisma = new PrismaClient()
const router = express.Router()

// Subscribe to a plan
router.post("/", authenticateToken, async (req, res) => {
  const { planId, amount } = req.body
  const plan = await prisma.investmentPlan.findUnique({ where: { id: planId } })
  if (!plan) return res.status(404).json({ error: "Plan not found" })
  if (amount < plan.minAmount) return res.status(400).json({ error: "Amount too low" })

  const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } })
  if (wallet.balance < amount) return res.status(400).json({ error: "Insufficient balance" })

  await prisma.wallet.update({
    where: { userId: req.user.id },
    data: { balance: { decrement: amount } }
  })

  const endDate = new Date()
  endDate.setDate(endDate.getDate() + plan.duration)

  const investment = await prisma.investment.create({
    data: { amount, userId: req.user.id, planId, endDate }
  })

  res.json({ message: "Investment started", investment })
})

// Active investments
router.get("/active", authenticateToken, async (req, res) => {
  const investments = await prisma.investment.findMany({
    where: { userId: req.user.id, status: "active" },
    include: { plan: true }
  })
  res.json(investments)
})

// Investment history
router.get("/history", authenticateToken, async (req, res) => {
  const investments = await prisma.investment.findMany({
    where: { userId: req.user.id },
    include: { plan: true },
    orderBy: { startDate: "desc" }
  })
  res.json(investments)
})

export default router
