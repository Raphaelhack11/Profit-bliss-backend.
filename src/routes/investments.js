import express from "express"
import { PrismaClient } from "@prisma/client"
import { authenticateToken } from "../middleware/auth.js"

const prisma = new PrismaClient()
const router = express.Router()

// ✅ Subscribe to a plan
router.post("/", authenticateToken, async (req, res) => {
  const { planId, amount } = req.body

  try {
    const plan = await prisma.investmentPlan.findUnique({ where: { id: planId } })
    if (!plan) return res.status(404).json({ error: "Plan not found" })

    // ✅ enforce minimum only
    if (amount < plan.minAmount) {
      return res.status(400).json({ error: `Minimum amount is ${plan.minAmount}` })
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } })
    if (!wallet) return res.status(404).json({ error: "Wallet not found" })
    if (wallet.balance < amount) return res.status(400).json({ error: "Insufficient balance" })

    // Deduct from wallet
    await prisma.wallet.update({
      where: { userId: req.user.id },
      data: { balance: { decrement: amount } }
    })

    // Calculate dates
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + plan.duration)

    // Save investment
    const investment = await prisma.investment.create({
      data: {
        amount,
        userId: req.user.id,
        planId,
        startDate,
        endDate,
        status: "active"
      },
      include: { plan: true }
    })

    res.json({ message: "Investment started", investment })
  } catch (err) {
    console.error("Create investment error:", err)
    res.status(500).json({ error: "Failed to create investment" })
  }
})

// ✅ Get all investments (active + history)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const investments = await prisma.investment.findMany({
      where: { userId: req.user.id },
      include: { plan: true },
      orderBy: { startDate: "desc" }
    })
    res.json(investments)
  } catch (err) {
    console.error("Fetch investments error:", err)
    res.status(500).json({ error: "Failed to fetch investments" })
  }
})

// ✅ Active investments only
router.get("/active", authenticateToken, async (req, res) => {
  try {
    const investments = await prisma.investment.findMany({
      where: { userId: req.user.id, status: "active" },
      include: { plan: true },
      orderBy: { startDate: "desc" }
    })
    res.json(investments)
  } catch (err) {
    console.error("Fetch active investments error:", err)
    res.status(500).json({ error: "Failed to fetch active investments" })
  }
})

// ✅ Investment history
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const investments = await prisma.investment.findMany({
      where: { userId: req.user.id },
      include: { plan: true },
      orderBy: { startDate: "desc" }
    })
    res.json(investments)
  } catch (err) {
    console.error("Fetch investment history error:", err)
    res.status(500).json({ error: "Failed to fetch investment history" })
  }
})

export default router
