import { Router } from 'express';
import { createEntry, getEntries } from '../controllers/entry.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticateToken, createEntry);
router.get('/', authenticateToken, getEntries);

export default router;