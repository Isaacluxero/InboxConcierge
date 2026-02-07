import { SearchService } from '../services/search.service.js';
import logger from '../utils/logger.js';

export const smartSearch = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const searchService = new SearchService(req.user.id);

    // Smart hybrid search - automatically chooses best strategy
    const results = await searchService.smartSearch(query.trim());

    logger.info(
      `[SmartSearch] User ${req.user.id}: "${query}" - ` +
      `Strategy: ${results.strategy}, Found: ${results.emails.length} results`
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('[SmartSearch] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const keywordSearch = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query parameter "q" is required'
      });
    }

    const searchService = new SearchService(req.user.id);

    const results = await searchService.keywordSearch(q.trim());

    logger.info(`Keyword search for user ${req.user.id}: "${q}" - found ${results.emails.length} results`);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Keyword search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const generateEmbeddings = async (req, res) => {
  try {
    const searchService = new SearchService(req.user.id);

    const result = await searchService.generateMissingEmbeddings(100);

    logger.info(`[VectorSearch] Generated embeddings for ${result.processed} emails, ${result.remaining} remaining`);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[VectorSearch] Generate embeddings error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
