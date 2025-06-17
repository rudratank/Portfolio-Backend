import express from 'express';
import { uploadMiddleware } from '../../Middleware/uploadMiddleware.js';
import { verifyToken } from '../../Middleware/Authatication.js';

const router = express.Router();

// Specific route for image uploads
router.post('/image',verifyToken, uploadMiddleware, (req, res) => {
  if (!req.body.image) {
    return res.status(400).json({
      success: false,
      message: 'No image file uploaded'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Image uploaded successfully',
    filepath: req.body.image
  });
});

export default router;