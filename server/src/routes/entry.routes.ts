import { Router } from 'express';
import { createEntry, getEntries, deleteEntry, updateEntry } from '../controllers/entry.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticateToken, createEntry);
router.get('/', authenticateToken, getEntries);
router.delete('/:id', authenticateToken, deleteEntry);
router.put('/:id', authenticateToken, updateEntry);

export default router;