import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";

// Import routes
import connection from "./utils/DbConnection.js";
import Adminauth from "./Routes/AdminAuthRoutes.js";
import UpdateData from "./Routes/HomeRoutes.js";
import aboutRoutes from "./Routes/AboutRoutes.js";
import educationRoutes from "./Routes/EducationRoutes.js";
import SkillRoutes from "./Routes/SkillsRoutes.js";
import projectRoute from "./Routes/ProjectRoutes.js";
import certificateRoutes from "./Routes/certificateRoutes.js";
import messageRoutes from "./Routes/MessageRoutes.js";
import dashboardRoutes from "./Routes/DashboardRoutes.js";
import userDataRoutes from "./Routes/UserRoutes/HomegetDataRoutes.js";
import { sessionMiddleware } from "./Middleware/SessionMiddleware.js";
import { trackPageView } from "./Middleware/TrackPageviewMiddleware.js";
import uploadRoutes from "./Routes/UserRoutes/UploadRoutes.js";
import adminViewsRoutes from "./Routes/AdminViews.js";
import { globalErrorHandler } from "./utils/errorHandler.js";
import cacheMiddleware, {
  invalidateCache,
  clearAllCache,
} from "./Middleware/catchMiddleware.js";

let isReady = false;

// Configuration
const app = express();
const port = process.env.PORT || 3005;
const databaseurl = process.env.DATABASE_URL;

// Enable trust proxy - Add this FIRST
app.set("trust proxy", 1);

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// FIXED: Enhanced CORS configuration with all necessary headers
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "https://rudracodes.netlify.app",
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:5000",
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
    "Cache-Control", // Added this
    "Pragma",       // Added this
    "Expires",      // Added this
    "Connection",   // Added this
    "Keep-Alive"    // Added this
  ],
  exposedHeaders: [
    "Content-Length",
    "X-Foo",
    "X-Bar",
    "Cache-Control"
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

// Apply CORS first
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options("*", cors(corsOptions));

// REMOVED: Connection headers middleware that was causing issues
// The browser automatically handles Connection headers, setting them manually can cause conflicts

// Basic middleware
app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));

// FIXED: Status endpoint with proper database check and CORS headers
app.get("/api/status", async (req, res) => {
  try {
    // Set CORS headers explicitly for this endpoint
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", "0");

    let dbStatus = "disconnected";

    if (mongoose.connection.readyState === 1) {
      // Try to ping database
      await mongoose.connection.db.admin().ping();
      dbStatus = "connected";
    }

    res.status(200).json({
      status: "online",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      service: "portfolio-backend",
      uptime: process.uptime(),
      ready: isReady,
    });
  } catch (error) {
    console.error("Status check error:", error);
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.status(500).json({
      status: "degraded",
      error: error.message,
      database: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
});

// Ready endpoint
app.get("/api/ready", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  
  if (isReady) {
    res.status(200).json({ status: "ready", message: "Server is ready" });
  } else {
    res
      .status(503)
      .json({ status: "initializing", message: "Server is starting up" });
  }
});

// Root endpoint for basic health check with CORS headers
app.get("/", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");
  
  res.status(200).json({
    message: "Portfolio Backend API",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

// Session and tracking middleware
app.use(sessionMiddleware);
app.use(trackPageView);

// FIXED: Security middleware with relaxed settings for development
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "unsafe-none" },
    crossOriginEmbedderPolicy: { policy: "unsafe-none" },
    // Disable some strict policies that might interfere
    contentSecurityPolicy: false,
    hsts: false,
  })
);

// Static files
app.use(
  "/uploads",
  express.static(path.join(__dirname, "./uploads"), {
    setHeaders: (res, path) => {
      res.set("Cache-Control", "no-cache");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      res.set("Access-Control-Allow-Origin", "*");
    },
  })
);

// FIXED: Rate limiters with better error handling
const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: {
    error: "Too many admin requests from this IP, please try again in an hour!",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/status' || req.path === '/api/ready' || req.path === '/';
  },
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many requests",
      message:
        "Too many admin requests from this IP, please try again in an hour!",
      retryAfter: Math.round((60 * 60 * 1000) / 1000),
    });
  },
});

const portfolioLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: {
    error: "Too many requests from this IP, please try again in 15 minutes!",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/status' || req.path === '/api/ready' || req.path === '/';
  },
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many requests",
      message:
        "Too many requests from this IP, please try again in 15 minutes!",
      retryAfter: Math.round((15 * 60 * 1000) / 1000),
    });
  },
});

// Cache management
app.post("/api/admin/clear-cache", (req, res) => {
  try {
    clearAllCache();
    res.json({ success: true, message: "Cache cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to clear cache" });
  }
});

// Apply rate limiting (but not to health check endpoints)
app.use("/api/auth", adminLimiter);
app.use("/api/home", adminLimiter);
app.use("/api/about", adminLimiter);
app.use("/api/education", adminLimiter);
app.use("/api/skills", adminLimiter);
app.use("/api/project", adminLimiter);
app.use("/api/certificate", adminLimiter);
app.use("/api/dashboard", adminLimiter);
app.use("/api/messages", adminLimiter);
app.use("/api/upload", adminLimiter);
app.use("/api/user", portfolioLimiter);

// Admin status tracking
let isAdminActive = false;

app.get("/api/admin/active-status", (req, res) => {
  res.json({ isActive: isAdminActive });
});

app.post("/api/admin/clear-active-status", (req, res) => {
  isAdminActive = false;
  res.json({ success: true });
});

// Routes
app.use("/api/auth", Adminauth);
app.use("/api/home", UpdateData);
app.use("/api/about", aboutRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/skills", SkillRoutes);
app.use("/api/project", projectRoute);
app.use("/api/certificate", certificateRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/user", userDataRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/views", adminViewsRoutes);

// 404 handler for undefined routes
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableRoutes: ["/api/status", "/api/ready", "/api/auth", "/api/user"],
  });
});

// Global error handling
app.use(globalErrorHandler);

// Database connection with better error handling
const connectDatabase = async () => {
  try {
    await connection(databaseurl, {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 30000,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true,
    });

    console.log("Database connected successfully");
    isReady = true;
  } catch (error) {
    console.error("Database connection failed:", error);
    // Don't exit the process, keep trying to reconnect
    setTimeout(connectDatabase, 5000);
  }
};

// Start server
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  connectDatabase();
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});

export default app;