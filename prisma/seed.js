import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear old plans (optional, if you don’t want duplicates)
  await prisma.investmentPlan.deleteMany();

  // Seed new plans
  await prisma.investmentPlan.createMany({
    data: [
      {
        name: "Starter Plan",
        description: "Beginner friendly plan for small investors",
        minAmount: 100,
        roi: 30,          // 5% return
        duration: 7,     // 7 days
      },
      {
        name: "Standard Plan",
        description: "Balanced plan with medium returns",
        minAmount: 500,
        roi: 50,         // 10% return
        duration: 14,    // 14 days
      },
      {
        name: "Premium Plan",
        description: "High return plan for serious investors",
        minAmount: 1000,
        roi: 75,         // 20% return
        duration: 30,    // 30 days
      },
    ],
  });

  console.log("✅ Investment Plans seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
