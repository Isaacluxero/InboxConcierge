import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { bucketValidation } from '../middleware/validation.middleware.js';
import {
  getBuckets,
  getBucketById,
  createBucket,
  updateBucket,
  deleteBucket,
  reclassifyEmails
} from '../controllers/bucket.controller.js';

const router = express.Router();

// All bucket routes require authentication
router.use(requireAuth);

// Get all buckets
router.get('/', getBuckets);

// Reclassify emails
router.post('/reclassify', reclassifyEmails);

// Get specific bucket
router.get('/:id', getBucketById);

// Create bucket
router.post('/', bucketValidation.create, createBucket);

// Update bucket
router.patch('/:id', bucketValidation.update, updateBucket);

// Delete bucket
router.delete('/:id', deleteBucket);

export default router;
