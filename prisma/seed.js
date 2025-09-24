// prisma/seed.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Example investment plans
  const plans = [
    {
      name: "Starter Plan",
      description: "Perfect for beginners",
      minAmount: 100,
      roi: 10,
      duration: 30,
    },
    {
      name: "Pro Plan",
      description: "For consistent investors",
      minAmount: 500,
      roi: 15,
      duration: 60,
    },
    {
      name: "Elite Plan",
      description: "High ROI for big investors",
      minAmount: 1000,
      roi: 20,
      duration: 90,
    },
  ];

  for (const plan of plans) {
    await prisma.investmentPlan.upsert({
      where: { name: plan.name },
      update: {},
      create: plan,
    });
  }

  console.log("✅ Seeding completed.");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
