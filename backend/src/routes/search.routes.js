import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { searchValidation } from '../middleware/validation.middleware.js';
import { smartSearch, keywordSearch, generateEmbeddings } from '../controllers/search.controller.js';

const router = express.Router();

// All search routes require authentication
router.use(requireAuth);

// Smart search with vector embeddings
router.post('/', searchValidation.query, smartSearch);

// Simple keyword search
router.get('/keyword', keywordSearch);

// Generate embeddings for emails
router.post('/embeddings', generateEmbeddings);

export default router;
