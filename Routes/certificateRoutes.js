import express from 'express';
import { uploadMiddleware } from '../Middleware/uploadMiddleware.js';
import { verifyToken } from '../Middleware/Authatication.js';
import { addCertificate, deleteCertificate, getCertificate, updateCertificate } from '../Controller/certificateController.js';

const router = express.Router();

// Certificate routes
router.get('/get-certificate', verifyToken, getCertificate);
router.post('/add-certificate', verifyToken, uploadMiddleware, addCertificate);
router.put('/edit-certificate/:id', verifyToken, uploadMiddleware, updateCertificate);
router.delete('/delete-certificate/:id', verifyToken, deleteCertificate);

export default router;