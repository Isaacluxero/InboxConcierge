import api from './api';

/**
 * Email service
 * Handles email fetching, syncing, and management
 */
export const emailService = {
  /**
   * Sync emails from Gmail
   * @returns {Promise<Object>} Sync results with counts
   */
  syncEmails: async () => {
    const response = await api.post('/api/emails/sync');
    return response.data;
  },

  /**
   * Get emails with optional filters
   * @param {Object} params - Query parameters for filtering
   * @returns {Promise<Object>} Email list and metadata
   */
  getEmails: async (params = {}) => {
    const response = await api.get('/api/emails', { params });
    return response.data;
  },

  /**
   * Get email by ID
   * @param {string} id - Email ID
   * @returns {Promise<Object>} Email data
   */
  getEmailById: async (id) => {
    const response = await api.get(`/api/emails/${id}`);
    return response.data;
  },

  /**
   * Update email's bucket assignment
   * @param {string} id - Email ID
   * @param {string} bucketId - New bucket ID
   * @returns {Promise<Object>} Updated email data
   */
  updateEmailBucket: async (id, bucketId) => {
    const response = await api.patch(`/api/emails/${id}/bucket`, { bucketId });
    return response.data;
  }
};
