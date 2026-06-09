// server.js

import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";

import ewasteRoutes from "./routes/EwasteRoutes.js";
import pickupRoutes from "./routes/pickupRequestRoutes.js";
import impactLogRoutes from "./routes/impactLogRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import holidayRoutes from "./routes/holidayRoutes.js";

import usersRoutes from "./routes/users.js";
import adminRoutes from "./routes/admin.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";

// Load environment variables
dotenv.config();

// Create express app
const app = express();

app.set("trust proxy", 1);

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://project-eco-cycle.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow Postman, server-to-server requests, and same-origin requests
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// CORS must come before routes, JSON parser, limiter, and error handlers
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// Body parser
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 80,
  standardHeaders: true,
  legacyHeaders: false,

  // Important: do not block browser preflight requests
  skip: (req) => req.method === "OPTIONS",
});

// Apply rate limiting after CORS
app.use(limiter);

// Connect to MongoDB
connectDB();

// Basic test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Routes
app.use("/api/ewaste", ewasteRoutes);
app.use("/api/pickups", pickupRoutes);
app.use("/api/impact-logs", impactLogRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Port
const PORT = process.env.PORT || 5050;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});