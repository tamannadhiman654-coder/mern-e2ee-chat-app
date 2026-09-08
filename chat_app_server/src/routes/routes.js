import { Router } from 'express';
import { register, login, getPublicKey } from '../controller/authcontroller.js';
import { getMessageHistory, saveMessage, deleteChat } from '../controller/messagecontroller.js';
import { getProfile, updateProfile, searchUsers, getAllUsers, deleteAccount } from '../controller/usercontroller.js';
import {
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends
} from '../controller/friendcontroller.js';
import { uploadImage } from '../controller/uploadcontroller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadmiddleware.js';
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

// User Profile & Account Endpoints
router.get('/user/profile', verifyToken, getProfile);
router.put('/user/profile', verifyToken, updateProfile);
router.delete('/user/account', verifyToken, deleteAccount);

// User Search & Directory Endpoints
router.get('/users/search', verifyToken, searchUsers);
router.get('/users/all', verifyToken, getAllUsers);

// Friend Request Endpoints
router.post('/friends/request/:receiverId', verifyToken, sendFriendRequest);
router.get('/friends/requests', verifyToken, getFriendRequests);
router.post('/friends/accept/:requestId', verifyToken, acceptFriendRequest);
router.post('/friends/reject/:requestId', verifyToken, rejectFriendRequest);
router.get('/friends', verifyToken, getFriends);

// Encrypted Message History & Deletion Endpoints
router.get('/messages/:receiverId', verifyToken, getMessageHistory);
router.post('/messages', verifyToken, validateMessage, handleValidationErrors, saveMessage);
router.delete('/messages/:receiverId', verifyToken, deleteChat);

// Media Upload Endpoint (Cloudinary with graceful fallback)
router.post('/upload', verifyToken, upload.single('image'), uploadImage);

export default router;