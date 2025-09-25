import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import transactionRoutes from "./routes/transactions.js";
import walletRoutes from "./routes/wallet.js";
import planRoutes from "./routes/plans.js";
import investmentRoutes from "./routes/investments.js";
import adminRoutes from "./routes/admin.js";

import "./jobs/cron.js";

dotenv.config();
const app = express();

// ✅ Allow frontend on Vercel + localhost during dev
app.use(cors({
  origin: [
    "http://localhost:5173", // Vite dev
    "https://profit-bliss-org-us.vercel.app/" // Replace with your real Vercel URL
  ],
  credentials: true,
}));

app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("🚀 API is running on Render");
});

// Routes
app.use("/auth", authRoutes);
app.use("/transactions", transactionRoutes);
app.use("/wallet", walletRoutes);
app.use("/plans", planRoutes);
app.use("/investments", investmentRoutes);
app.use("/admin", adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
