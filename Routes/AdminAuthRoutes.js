import express from "express";
import rateLimit from "express-rate-limit";
import {
  getAdminProfile,
  login,
  logout,
  unlockAccount,
  verifyOTP,
  healthCheck, // Add this import
} from "../Controller/AdminAuthController.js";
import {
  logActivity,
  validateLoginRequest,
  verifyToken,
} from "../Middleware/Authatication.js";

const router = express.Router();
// Add this at the top of your public routes (before any auth middleware)
// Simple health check endpoint (no middleware needed)
router.get("/health", (req, res) => {
  res.setHeader("Cache-Control", "no-cache");
  res.status(200).json({
    status: "online",
    timestamp: new Date().toISOString(),
    service: "admin-auth",
  });
});
// Apply rate limiting to auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many login attempts, please try again later",
});

// Public routes
router.get("/health", logActivity, healthCheck); // Add this line
router.post("/admin-auth", validateLoginRequest, logActivity, login);
router.post("/verify-otp", logActivity, verifyOTP);
router.post(
  "/admin-auth/unlock-account",
  authLimiter,
  logActivity,
  unlockAccount
);

// Protected routes (require authentication)
router.get("/admin-profile", verifyToken, logActivity, getAdminProfile);
router.post("/admin-logout", verifyToken, logActivity, logout);

export default router;
