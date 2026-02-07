import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { mockEmail, mockBucket, mockPrismaClient } from './setup.js';

// Mock dependencies
jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
}));

const { AnalyticsService } = await import('../services/analytics.service.js');

describe('Analytics Service', () => {
  let analyticsService;
  const userId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsService = new AnalyticsService(userId);

    // Add missing mock for groupBy
    mockPrismaClient.email.groupBy = jest.fn();
  });

  describe('getTopSenders', () => {
    it('should limit results to specified count', () => {
      const emails = Array(20).fill(null).map((_, i) => ({
        ...mockEmail,
        senderEmail: `sender${i}@example.com`,
        senderName: `Sender ${i}`,
      }));

      const result = analyticsService.getTopSenders(emails, 10);

      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('should handle empty email list', () => {
      const result = analyticsService.getTopSenders([], 10);
      expect(result).toEqual([]);
    });
  });

  describe('getAveragePerDay', () => {
    it('should handle empty email list', () => {
      const result = analyticsService.getAveragePerDay([]);
      expect(result).toBe(0);
    });
  });
});
