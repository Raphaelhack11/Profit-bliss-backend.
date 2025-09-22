import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cron from "node-cron";
import prisma from "./prismaClient.js";

// routes
import authRoutes from "./routes/auth.js";
import walletRoutes from "./routes/wallet.js";
import planRoutes from "./routes/plans.js";
import transactionRoutes from "./routes/transactions.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// routes
app.use("/auth", authRoutes);
app.use("/wallet", walletRoutes);
app.use("/plans", planRoutes);
app.use("/transactions", transactionRoutes);

// health check
app.get("/", (req, res) => {
  res.send("🚀 Profit Bliss API is running...");
});

// cron job: check investments every hour
cron.schedule("0 * * * *", async () => {
  console.log("⏳ Running cron job to check matured investments...");

  try {
    const now = new Date();

    // find active investments that have matured
    const maturedInvestments = await prisma.investment.findMany({
      where: {
        status: "active",
        endDate: { lte: now },
      },
      include: { plan: true, user: true },
    });

    for (const inv of maturedInvestments) {
      const profit = inv.amount * (inv.plan.roi / 100);
      const totalReturn = inv.amount + profit;

      // update wallet
      await prisma.wallet.update({
        where: { userId: inv.userId },
        data: { balance: { increment: totalReturn } },
      });

      // mark investment as completed
      await prisma.investment.update({
        where: { id: inv.id },
        data: { status: "completed" },
      });

      console.log(
        `✅ Credited $${totalReturn} to user ${inv.user.email} for plan ${inv.plan.name}`
      );
    }
  } catch (error) {
    console.error("❌ Cron job failed:", error);
  }
});

// error handling
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong" });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
