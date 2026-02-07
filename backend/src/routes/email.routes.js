import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  syncEmails,
  getEmails,
  getEmailById,
  updateEmailBucket
} from '../controllers/email.controller.js';

const router = express.Router();

// All email routes require authentication
router.use(requireAuth);

// Sync emails from Gmail
router.post('/sync', syncEmails);

// Get emails with optional filtering
router.get('/', getEmails);

// Get specific email
router.get('/:id', getEmailById);

// Update email bucket
router.patch('/:id/bucket', updateEmailBucket);

export default router;
