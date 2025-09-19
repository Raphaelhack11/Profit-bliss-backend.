import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import cron from "node-cron"
import { PrismaClient } from "@prisma/client"
import { calculateROI } from "./utils/calculateROI.js"

import authRoutes from "./routes/auth.js"
import walletRoutes from "./routes/wallet.js"
import planRoutes from "./routes/investmentPlans.js"
import investmentRoutes from "./routes/investments.js"

dotenv.config()
const app = express()
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => res.send("Profit Bliss API Running ✅"))

app.use("/auth", authRoutes)
app.use("/wallet", walletRoutes)
app.use("/plans", planRoutes)
app.use("/investments", investmentRoutes)

// Cron job: runs daily at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("⏰ Running daily investment check...")

  const now = new Date()
  const matured = await prisma.investment.findMany({
    where: { status: "active", endDate: { lte: now } },
    include: { plan: true }
  })

  for (let inv of matured) {
    const payout = calculateROI(inv.amount, inv.plan.roi)
    await prisma.wallet.update({
      where: { userId: inv.userId },
      data: { balance: { increment: payout } }
    })

    await prisma.investment.update({
      where: { id: inv.id },
      data: { status: "completed" }
    })
  }

  console.log(`✅ Processed ${matured.length} matured investments`)
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
