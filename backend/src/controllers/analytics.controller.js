import { AnalyticsService } from '../services/analytics.service.js';
import logger from '../utils/logger.js';

export const analyticsController = {
  /**
   * GET /api/analytics/insights
   * Get comprehensive email analytics for the authenticated user
   */
  async getInsights(req, res) {
    try {
      const userId = req.user.id;
      const analyticsService = new AnalyticsService(userId);

      const insights = await analyticsService.getInsights();

      res.json({
        success: true,
        data: insights
      });
    } catch (error) {
      logger.error('Analytics insights error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate insights'
      });
    }
  }
};
