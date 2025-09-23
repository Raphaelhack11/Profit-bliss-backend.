// prisma/seed.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Default Investment Plans
  const plans = [
    {
      name: "Basic Plan",
      description: "Entry-level investment plan.",
      minAmount: 100,
      roi: 10,
      duration: 7,
    },
    {
      name: "Master Plan",
      description: "Higher return for serious investors.",
      minAmount: 500,
      roi: 25,
      duration: 30,
    },
    {
      name: "Ranking Plan",
      description: "Exclusive plan with the best ROI.",
      minAmount: 1000,
      roi: 50,
      duration: 60,
    },
  ];

  for (const plan of plans) {
    await prisma.investmentPlan.upsert({
      where: { name: plan.name },
      update: {},
      create: plan,
    });
  }

  console.log("✅ Default investment plans seeded successfully!");

  // Default Admin User
  const adminEmail = "admin@profitbliss.com";
  const adminPassword = "Admin123"; // Change later in production
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: "Admin User",
      country: "Nigeria",
      phone: "+2340000000000",
      wallet: {
        create: {
          balance: 0,
        },
      },
    },
    include: { wallet: true },
  });

  console.log("✅ Default admin user created:");
  console.log({
    email: adminUser.email,
    password: adminPassword,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
