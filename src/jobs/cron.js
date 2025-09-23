import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Run every minute → "*/1 * * * *"
cron.schedule("*/1 * * * *", async () => {
  console.log("⏳ Running cron job to process deposits...");

  try {
    // Find all pending deposits
    const pendingTxs = await prisma.transaction.findMany({
      where: { type: "deposit", status: "pending" },
    });

    for (const tx of pendingTxs) {
      // Mark transaction as completed
      await prisma.transaction.update({
        where: { id: tx.id },
        data: { status: "completed" },
      });

      // Credit wallet
      await prisma.wallet.update({
        where: { userId: tx.userId },
        data: { balance: { increment: tx.amount } },
      });

      console.log(`✅ Processed deposit #${tx.id} for user ${tx.userId}`);
    }
  } catch (err) {
    console.error("❌ Cron job failed:", err);
  }
});

export default cron;
