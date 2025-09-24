// prisma/seed.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ✅ Seed investment plans
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

  console.log("✅ Plans seeded");

  // ✅ Try to seed admin user safely
  try {
    const adminPassword = "Admin123!"; // default password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await prisma.user.upsert({
      where: { email: "admin@profitbliss.org" },
      update: {},
      create: {
        email: "admin@profitbliss.org",
        password: hashedPassword,
        name: "Super Admin",
        country: "N/A",
        phone: "0000000000",
        role: "admin", // ⚠️ Will throw if column doesn't exist
      },
    });

    console.log(
      "✅ Admin user seeded (email: admin@profitbliss.org, password: Admin123!)"
    );
  } catch (err) {
    console.warn(
      "⚠️ Could not seed admin user. Did you forget to add 'role' field to User model?"
    );
    console.error(err.message);
  }
}

main()
  .catch((e) => {
    console.error("❌ Error seeding data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
