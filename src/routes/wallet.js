import express from "express"
import { PrismaClient } from "@prisma/client"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()
const prisma = new PrismaClient()

// Get wallet
router.get("/", authenticateToken, async (req, res) => {
  const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } })
  res.json(wallet)
})

export default router
