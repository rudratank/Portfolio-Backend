import express from 'express';
import { 
  getAllEducation, 
  createEducation, 
  updateEducation, 
  deleteEducation, 
} from '../Controller/EducationController.js';
import { verifyToken } from '../Middleware/Authatication.js';
const router = express.Router();

// Public routes
router.get('/',verifyToken, getAllEducation);

// Protected routes
router.post('/',verifyToken, createEducation);
router.put('/:id', updateEducation);
router.delete('/:id', verifyToken, deleteEducation);

// router.post('/certificate', verifyToken, singleFileUpload('image'), addCertificate);
// router.delete('/certificate/:id', verifyToken, deleteCertificate);

export default router;