import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import transactionRoutes from "./routes/transactions.js";
import walletRoutes from "./routes/wallet.js";   // ✅ add
import planRoutes from "./routes/plans.js";       // ✅ add
import investmentRoutes from "./routes/investments.js"; // ✅ add
import "./jobs/cron.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("🚀 API is running");
});

// routes
app.use("/auth", authRoutes);
app.use("/transactions", transactionRoutes);
app.use("/wallet", walletRoutes);          // ✅ mount
app.use("/plans", planRoutes);             // ✅ mount
app.use("/investments", investmentRoutes); // ✅ mount
app.use("/admin", adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
