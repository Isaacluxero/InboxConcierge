import api from './api';

/**
 * Analytics service
 * Handles email analytics and insights
 */
export const analyticsService = {
  /**
   * Get analytics insights
   * @returns {Promise<Object>} Analytics data and insights
   */
  getInsights: async () => {
    const response = await api.get('/api/analytics/insights');
    return response.data;
  }
};
