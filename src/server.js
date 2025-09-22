import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import cron from "node-cron";

// Routes
import authRoutes from "./routes/auth.js";
import planRoutes from "./routes/plans.js";
import transactionRoutes from "./routes/transactions.js";

dotenv.config();
const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/auth", authRoutes);          // signup & login
app.use("/plans", planRoutes);         // investment plans
app.use("/transactions", transactionRoutes); // deposit & withdraw

// Health check
app.get("/", (req, res) => {
  res.send("✅ Profit Bliss backend running");
});


// ==========================
// CRON JOBS
// ==========================

// Runs every hour → check matured investments
cron.schedule("0 * * * *", async () => {
  console.log("⏰ Running cron job: check matured investments...");

  try {
    const now = new Date();

    // Find matured investments (status still active, but endDate <= now)
    const matured = await prisma.investment.findMany({
      where: {
        status: "active",
        endDate: { lte: now }
      },
      include: { user: true, plan: true }
    });

    for (const inv of matured) {
      const roiAmount = (inv.amount * inv.plan.roi) / 100;
      const totalReturn = inv.amount + roiAmount;

      // Credit wallet
      await prisma.wallet.update({
        where: { userId: inv.userId },
        data: {
          balance: { increment: totalReturn }
        }
      });

      // Mark investment as completed
      await prisma.investment.update({
        where: { id: inv.id },
        data: { status: "completed" }
      });

      console.log(`💰 Credited ${totalReturn} to ${inv.user.email}`);
    }
  } catch (err) {
    console.error("❌ Cron job error:", err);
  }
});


// Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
