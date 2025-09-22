// src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

// Import routes
import authRoutes from "./routes/auth.js";
import planRoutes from "./routes/plans.js";
import investmentRoutes from "./routes/investments.js";
import transactionRoutes from "./routes/transactions.js";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/plans", planRoutes);
app.use("/investments", investmentRoutes);
app.use("/transactions", transactionRoutes);

// Health check route
app.get("/", (req, res) => {
  res.send("✅ Profit Bliss API is running...");
});

/* ----------------- CRON JOBS ----------------- */

// 1. Auto-complete matured investments daily at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("⏳ Running daily investment maturity check...");
  try {
    const now = new Date();

    const matured = await prisma.investment.findMany({
      where: {
        status: "active",
        endDate: { lte: now },
      },
      include: { plan: true, user: { include: { wallet: true } } },
    });

    for (const inv of matured) {
      const profit = (inv.amount * inv.plan.roi) / 100;
      await prisma.wallet.update({
        where: { userId: inv.userId },
        data: { balance: inv.user.wallet.balance + inv.amount + profit },
      });

      await prisma.investment.update({
        where: { id: inv.id },
        data: { status: "completed" },
      });
    }

    console.log(`✅ Processed ${matured.length} matured investments.`);
  } catch (err) {
    console.error("❌ Error in maturity cron job:", err);
  }
});

// 2. Auto-expire deposits & withdrawals after 1 hour
cron.schedule("*/10 * * * *", async () => {
  console.log("⏳ Checking for expired transactions...");
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const expired = await prisma.transaction.updateMany({
      where: {
        status: "pending",
        createdAt: { lte: oneHourAgo },
      },
      data: { status: "expired" },
    });

    if (expired.count > 0) {
      console.log(`⚠️ Auto-expired ${expired.count} old transactions.`);
    }
  } catch (err) {
    console.error("❌ Error in transaction expiry cron job:", err);
  }
});
/* --------------------------------------------- */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
