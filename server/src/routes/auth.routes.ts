import { Router } from 'express';
import { 
  login, logout, register, forgotPassword, resetPassword, verifyEmail,
  getProfile, updateProfile, changePassword, deleteAccount
} from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/logout', logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get('/me', authenticateToken, getProfile);
router.put('/me', authenticateToken, updateProfile);
router.post('/change-password', authenticateToken, changePassword);
router.post('/delete-account', authenticateToken, deleteAccount);

export default router;