import { Router } from 'express';
import { getSharedBrain, toggleSharing } from '../controllers/share.js';
import { authenticateToken } from '../middleware/userMiddleware.js';


const router = Router();

router.post('/share', authenticateToken, toggleSharing);
router.get('/:shareLink', getSharedBrain);

export default router;