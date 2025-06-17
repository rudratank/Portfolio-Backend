import express from "express";
import rateLimit from "express-rate-limit";
import {
  getAdminProfile,
  login,
  logout,
  unlockAccount,
  verifyOTP,
} from "../Controller/AdminAuthController.js";
import {
  logActivity,
  validateLoginRequest,
  verifyToken,
} from "../Middleware/Authatication.js";

const router = express.Router();

// Health check endpoint (no middleware needed)
router.get("/health", (req, res) => {
  res.setHeader("Cache-Control", "no-cache");
  res.status(200).json({
    status: "online",
    timestamp: new Date().toISOString(),
    service: "admin-auth",
  });
});

// Apply rate limiting to sensitive auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: "Too many login attempts, please try again later",
    retryAfter: 15 * 60, // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const unlockLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit unlock attempts
  message: {
    error: "Too many unlock attempts, please try again later",
    retryAfter: 60 * 60, // seconds
  },
});

// Public routes (no authentication required)
router.post(
  "/admin-auth",
  authLimiter,
  validateLoginRequest,
  logActivity,
  login
);
router.post("/verify-otp", authLimiter, logActivity, verifyOTP);
router.post(
  "/admin-auth/unlock-account",
  unlockLimiter,
  logActivity,
  unlockAccount
);

// Protected routes (require authentication)
router.get("/admin-profile", verifyToken, logActivity, getAdminProfile);
router.post("/admin-logout", verifyToken, logActivity, logout);

export default router;
