import express from 'express';
import { createMessage, deleteMessage, getAllMessages, updateMessageStatus } from '../Controller/MessageController.js';
import { verifyToken } from '../Middleware/Authatication.js';

const router = express.Router();

router.post('/make-message', createMessage);
router.get('/get-messages', getAllMessages);
router.patch('/edit-messages/:id/status',verifyToken, updateMessageStatus); // Fixed URL parameter format
router.delete('/delete-message/:id',verifyToken, deleteMessage); 

export default router;
