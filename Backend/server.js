//server.js

import dns from "dns";
dns.setDefaultResultOrder("ipv4first");


import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";       //megha   
import connectDB from "./config/db.js";

import ewasteRoutes from "./routes/EwasteRoutes.js";
import pickupRoutes from "./routes/pickupRequestRoutes.js";
import impactLogRoutes from "./routes/impactLogRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import holidayRoutes from "./routes/holidayRoutes.js";

import usersRoutes from "./routes/users.js";        //megha 
import adminRoutes from "./routes/admin.js";        //megha
import { notFound, errorHandler } from "./middleware/error.middleware.js";  //megha




// Load environment variables
dotenv.config();

// Create express app
const app = express();

app.set('trust proxy', 1);

// Rate limiting (anti-spam/DDoS protection)
const limiter = rateLimit({                     //megha
  windowMs: 60 * 1000, // 1 minute window
  max: 80 // Max 80 requests per minute
});

// Middleware
app.use(express.json()); // Body parser
app.use(limiter); // Apply rate limiting to all requests        //megha

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://project-eco-cycle.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

// Connect to MongoDB
connectDB();

// Basic test route
app.get("/", (req, res) => {
  res.send("API is running...");
});


// Port
const PORT = process.env.PORT || 5050;

// Routes
app.use("/api/ewaste", ewasteRoutes);
app.use("/api/pickups", pickupRoutes);
app.use("/api/impact-logs", impactLogRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/users", usersRoutes);           //megha
app.use("/api/admin", adminRoutes);           //megha

// 404 handler
app.use(notFound);                          //megha

// Global error handler
app.use(errorHandler);                    //megha



// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});  