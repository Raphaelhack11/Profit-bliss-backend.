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

// ✅ Allowed Frontend Origins
const allowedOrigins = [
  "http://localhost:5173",           // local Vite
  "https://equigrowinc.vercel.app",  // your deployed frontend
];

// ✅ CORS Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ✅ Handle preflight requests manually (important on Render)
app.options("*", cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Middleware
app.use(express.json());

// Health Check
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

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
