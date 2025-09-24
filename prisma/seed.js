// prisma/seed.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Create example investment plans
  const plans = [
    {
      name: "Starter Plan",
      description: "Perfect for beginners",
      minAmount: 100,
      roi: 30,
      duration: 7,
    },
    {
      name: "Pro Plan",
      description: "For consistent investors",
      minAmount: 300,
      roi: 50,
      duration: 15,
    },
    {
      name: "Elite Plan",
      description: "High ROI for big investors",
      minAmount: 500,
      roi: 75,
      duration: 20,
    },
  ];

  for (const plan of plans) {
    await prisma.investmentPlan.upsert({
      where: { name: plan.name },
      update: {},
      create: plan,
    });
  }

  // 2. Create admin user if it doesn’t exist
  const adminEmail = "admin@profitbliss.org";
  const adminPassword = await bcrypt.hash("Admin123!", 10); // 👈 change this after first login

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: adminPassword,
      name: "System Admin",
      country: "N/A",
      phone: "0000000000",
      role: "admin", // 👈 only seed.js should create admins
      wallet: { create: { balance: 0 } },
    },
  });

  console.log("✅ Seeding completed (plans + admin).");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
