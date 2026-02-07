import api from './api';

/**
 * Bucket service
 * Handles email bucket CRUD operations and reclassification
 */
export const bucketService = {
  /**
   * Get all buckets for current user
   * @returns {Promise<Object>} Bucket list
   */
  getBuckets: async () => {
    const response = await api.get('/api/buckets');
    return response.data;
  },

  /**
   * Get bucket by ID
   * @param {string} id - Bucket ID
   * @returns {Promise<Object>} Bucket data
   */
  getBucketById: async (id) => {
    const response = await api.get(`/api/buckets/${id}`);
    return response.data;
  },

  /**
   * Create new bucket
   * @param {Object} data - Bucket data (name, description, color)
   * @returns {Promise<Object>} Created bucket
   */
  createBucket: async (data) => {
    const response = await api.post('/api/buckets', data);
    return response.data;
  },

  /**
   * Update bucket
   * @param {string} id - Bucket ID
   * @param {Object} data - Updated bucket data
   * @returns {Promise<Object>} Updated bucket
   */
  updateBucket: async (id, data) => {
    const response = await api.patch(`/api/buckets/${id}`, data);
    return response.data;
  },

  /**
   * Delete bucket
   * @param {string} id - Bucket ID
   * @returns {Promise<Object>} Delete response
   */
  deleteBucket: async (id) => {
    const response = await api.delete(`/api/buckets/${id}`);
    return response.data;
  },

  /**
   * Reclassify all emails (or emails for specific bucket)
   * @param {string} [bucketId] - Optional bucket ID to reclassify specific bucket
   * @returns {Promise<Object>} Reclassification results
   */
  reclassifyEmails: async (bucketId) => {
    const response = await api.post('/api/buckets/reclassify', {}, {
      params: bucketId ? { bucketId } : {}
    });
    return response.data;
  }
};
