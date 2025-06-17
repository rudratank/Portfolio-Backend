import jwt from "jsonwebtoken";
import Admin from "../Models/AdminModel.js";

// Verify JWT token middleware
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    console.log("Token verification - token exists:", !!token);

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    console.log("Token decoded successfully:", {
      email: decoded.email,
      adminId: decoded.adminId,
    });

    // Optionally verify the admin still exists and is active
    const admin = await Admin.findById(decoded.adminId);
    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    if (admin.isLocked) {
      // Check if lock has expired
      if (Date.now() > admin.lockExpires) {
        admin.isLocked = false;
        admin.failedLoginAttempts = 0;
        await admin.save();
      } else {
        return res.status(403).json({
          message: "Account is locked",
          lockExpires: admin.lockExpires,
        });
      }
    }

    req.admin = {
      id: decoded.adminId,
      email: decoded.email,
      isAdminActive: admin.isAdminActive,
    };
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Token expired" });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid token" });
    } else {
      return res.status(401).json({ message: "Token verification failed" });
    }
  }
};

// Rate limiting middleware
export const rateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later",
};

// Request validation middleware
export const validateLoginRequest = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters long" });
  }

  next();
};

// Activity logging middleware
export const logActivity = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const { method, originalUrl, ip } = req;

  console.log(`[${timestamp}] ${method} ${originalUrl} - IP: ${ip}`);
  next();
};

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error("Error handler:", err.stack);

  if (err instanceof jwt.JsonWebTokenError) {
    return res.status(401).json({ message: "Invalid token" });
  }

  if (err instanceof jwt.TokenExpiredError) {
    return res.status(401).json({ message: "Token expired" });
  }

  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};
