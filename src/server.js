import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

import authRoutes from "./routes/auth.js";
import planRoutes from "./routes/plans.js";
import walletRoutes from "./routes/wallet.js";
import investmentRoutes from "./routes/investments.js";
import transactionRoutes from "./routes/transactions.js";

dotenv.config();
const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/auth", authRoutes);
app.use("/plans", planRoutes);
app.use("/wallet", walletRoutes);
app.use("/investments", investmentRoutes);
app.use("/transactions", transactionRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.send("🚀 Profit Bliss API is running...");
});

// Cron job — runs every hour
cron.schedule("0 * * * *", async () => {
  console.log("⏰ Running hourly job: checking investment maturity...");
  try {
    const now = new Date();
    const maturedInvestments = await prisma.investment.findMany({
      where: { status: "active", endDate: { lte: now } },
      include: { user: { include: { wallet: true } }, plan: true },
    });

    for (const inv of maturedInvestments) {
      const profit = (inv.amount * inv.plan.roi) / 100;

      // update wallet balance
      await prisma.wallet.update({
        where: { id: inv.user.wallet.id },
        data: { balance: inv.user.wallet.balance + inv.amount + profit },
      });

      // mark investment completed
      await prisma.investment.update({
        where: { id: inv.id },
        data: { status: "completed" },
      });

      console.log(
        `💰 Credited user ${inv.user.email} with ${
          inv.amount + profit
        } from plan ${inv.plan.name}`
      );
    }
  } catch (err) {
    console.error("❌ Error running cron job:", err);
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
