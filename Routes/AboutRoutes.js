import express from "express";
import { getAbout, updateAbout } from "../Controller/AboutController.js";
import { verifyToken } from "../Middleware/Authatication.js";
import { uploadMiddleware } from "../Middleware/uploadMiddleware.js";

const router = express.Router();

// Routes
router.get("/get-about", verifyToken, getAbout);
router.put("/update-about", verifyToken, uploadMiddleware, updateAbout);

// Remove this problematic route - it doesn't make sense
// router.get('/image', uploadMiddleware, updateAbout)

export default router;
