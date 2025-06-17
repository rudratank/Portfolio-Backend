import express from "express";
import { getHome, updateHome, uploadImage } from "../Controller/HomeController.js";
import { verifyToken } from "../Middleware/Authatication.js";
import { uploadMiddleware } from "../Middleware/uploadMiddleware.js";


const router = express.Router();

router.get("/get-data", verifyToken, getHome);
router.put("/update-home",verifyToken,updateHome);
// In your router file
router.post('/image', uploadMiddleware, uploadImage); // Use uploadImage instead of updateHome

export default router;
