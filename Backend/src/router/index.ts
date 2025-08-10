// src/router/index.ts
import { Router } from 'express';
import authRoutes from './authroute.js';
import contentRoutes from './contentroute.js';
import shareRoutes from './shareroute.js';

const router = Router();

// health check
router.get('/', (_req, res) => {
  res.send('API is alive and running!');
});

// mount route modules
router.use('/auth', authRoutes);      // -> /api/v1/auth/signup
router.use('/content', contentRoutes); // -> /api/v1/content
router.use('/brain', shareRoutes);    // -> /api/v1/brain/share

export default router;
