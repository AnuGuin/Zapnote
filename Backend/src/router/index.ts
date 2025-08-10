import { Router } from 'express';
import { signin, signup } from '../controllers/auth.js';
import { authenticateToken } from '../middleware/userMiddleware.js';
import { createContent, deleteContent, getContent } from '../controllers/content.js';
import { getSharedBrain, toggleSharing } from '../controllers/share.js';


const router = Router();

router.get('/', (_req, res) => {
  res.send('API is alive and running!');
});

router.post('/auth/signup', signup);
router.post('/auth/signin', signin );

router.post('/content', authenticateToken, createContent);
router.get('/content', authenticateToken, getContent);
router.delete('/content', authenticateToken, deleteContent);


router.post('/brain/share', authenticateToken, toggleSharing);
router.get('/brain/:shareLink', getSharedBrain);

export default router;