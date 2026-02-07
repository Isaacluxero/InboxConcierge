import express from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// All analytics routes require authentication
router.use(requireAuth);

// Get email insights
router.get('/insights', analyticsController.getInsights);

export default router;
