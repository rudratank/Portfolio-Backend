// backend/routes/adminViewsRoutes.js
import express from 'express';
import { getDashboardStats, getPageViews, getVisitorStats } from "../Controller/ViewsController.js";
import { verifyToken } from "../Middleware/Authatication.js";

const router = express.Router();

// Add CORS headers middleware if needed
router.use((req, res, next) => {
    // Allow multiple origins
    const allowedOrigins = [
      'http://localhost:5173', // Development
      'http://localhost:3001', // Alternative development port
      'http://your-frontend-domain.com' // Production
    ];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).json({
        body: "OK"
      });
    }
    
    next();
  });

// Make sure all responses are JSON
router.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

router.get("/stats", verifyToken, getDashboardStats);
router.get("/page-views", verifyToken, getPageViews);
router.get("/visitor-stats", verifyToken, getVisitorStats);

export default router;