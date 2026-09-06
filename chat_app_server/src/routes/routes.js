import { Router } from 'express';
import { register, login, getPublicKey } from '../controller/authcontroller.js';
import { getMessageHistory, saveMessage } from '../controller/messagecontroller.js';
import { uploadImage } from '../controller/uploadcontroller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import {
  validateRegister,
  validateLogin,
  validateMessage,
  handleValidationErrors
} from '../middleware/validationmiddleware.js';

const router = Router();

// Auth Endpoints
router.post('/auth/register', validateRegister, handleValidationErrors, register);
router.post('/auth/login', validateLogin, handleValidationErrors, login);
router.get('/auth/public-key/:userId', verifyToken, getPublicKey);

// Encrypted Message History Endpoints
router.get('/messages/:receiverId', verifyToken, getMessageHistory);
router.post('/messages', verifyToken, validateMessage, handleValidationErrors, saveMessage);

// Media Upload Endpoint (Cloudinary)
router.post('/upload', verifyToken, upload.single('image'), uploadImage);

export default router;