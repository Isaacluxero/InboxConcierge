import api from './api';

/**
 * Search service
 * Handles smart search, keyword search, and embedding generation
 */
export const searchService = {
  /**
   * Perform smart search with natural language query
   * @param {string} query - Natural language search query
   * @returns {Promise<Object>} Search results and metadata
   */
  smartSearch: async (query) => {
    const response = await api.post('/api/search', { query });
    return response.data;
  },

  /**
   * Perform keyword search
   * @param {string} query - Keyword query
   * @returns {Promise<Object>} Search results
   */
  keywordSearch: async (query) => {
    const response = await api.get('/api/search/keyword', {
      params: { q: query }
    });
    return response.data;
  },

  /**
   * Generate embeddings for all emails
   * @returns {Promise<Object>} Embedding generation results
   */
  generateEmbeddings: async () => {
    const response = await api.post('/api/search/embeddings');
    return response.data;
  }
};
