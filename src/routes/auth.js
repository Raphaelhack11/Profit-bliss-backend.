import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"

const router = express.Router()
const prisma = new PrismaClient()

// Register
router.post("/register", async (req, res) => {
  const { email, password, name, country, phone } = req.body
  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        country,
        phone,
        wallet: { create: { balance: 0 } }
      }
    })
    res.json({ message: "User registered", user })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(400).json({ error: "Invalid credentials" })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(400).json({ error: "Invalid credentials" })

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  })
  res.json({ token })
})

export default router
