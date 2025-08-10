import { Router } from 'express';
import { authenticateToken } from '../middleware/userMiddleware.js';
import { createContent, deleteContent, getContent } from '../controllers/content.js';

const router = Router();

// All these routes require authentication
router.use(authenticateToken);

router.post('/', createContent);
router.get('/', getContent);
router.delete('/', deleteContent);
