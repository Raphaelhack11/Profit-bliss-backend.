// src/server.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import cron from "node-cron";
import prisma from "./prismaClient.js";

// Load .env
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ===== Routes =====
import authRoutes from "./routes/auth.js";
import planRoutes from "./routes/plans.js";
import transactionRoutes from "./routes/transactions.js";

app.use("/auth", authRoutes);
app.use("/plans", planRoutes);
app.use("/transactions", transactionRoutes);

// ===== Health Check =====
app.get("/", (req, res) => {
  res.json({ status: "✅ API running" });
});

// ===== Cron Jobs =====
// Runs every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("⏰ Running daily investment maturity check...");
  const now = new Date();

  try {
    const matured = await prisma.investment.findMany({
      where: {
        endDate: { lte: now },
        status: "active",
      },
      include: { user: true, plan: true },
    });

    for (const inv of matured) {
      const profit = (inv.amount * inv.plan.roi) / 100;

      await prisma.wallet.update({
        where: { userId: inv.userId },
        data: { balance: { increment: inv.amount + profit } },
      });

      await prisma.investment.update({
        where: { id: inv.id },
        data: { status: "completed" },
      });

      console.log(`💰 Credited ${inv.amount + profit} to ${inv.user.email}`);
    }
  } catch (err) {
    console.error("❌ Cron job failed:", err.message);
  }
});

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
