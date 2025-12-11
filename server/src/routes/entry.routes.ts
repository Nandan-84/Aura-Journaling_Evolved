import { Router } from 'express';
import { createEntry, getEntries } from '../controllers/entry.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Apply "authenticateToken" middleware so only logged-in users can access
router.post('/', authenticateToken, createEntry);
router.get('/', authenticateToken, getEntries);

export default router;