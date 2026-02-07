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
  });

  describe('getBucketBreakdown', () => {
    it('should return bucket email counts', async () => {
      const mockBuckets = [
        { ...mockBucket, id: 1, name: 'Important' },
        { ...mockBucket, id: 2, name: 'Can Wait' },
      ];

      mockPrismaClient.bucket.findMany.mockResolvedValue(mockBuckets);
      mockPrismaClient.email.groupBy.mockResolvedValue([
        { bucketId: 1, _count: { id: 10 } },
        { bucketId: 2, _count: { id: 5 } },
      ]);

      const result = await analyticsService.getBucketBreakdown();

      expect(result).toEqual([
        { id: 1, name: 'Important', count: 10 },
        { id: 2, name: 'Can Wait', count: 5 },
      ]);
    });

    it('should handle buckets with no emails', async () => {
      mockPrismaClient.bucket.findMany.mockResolvedValue([mockBucket]);
      mockPrismaClient.email.groupBy.mockResolvedValue([]);

      const result = await analyticsService.getBucketBreakdown();

      expect(result).toEqual([
        { id: mockBucket.id, name: mockBucket.name, count: 0 },
      ]);
    });
  });

  describe('getTopSenders', () => {
    it('should return top senders by email count', () => {
      const emails = [
        { ...mockEmail, senderEmail: 'alice@example.com', senderName: 'Alice' },
        { ...mockEmail, senderEmail: 'alice@example.com', senderName: 'Alice' },
        { ...mockEmail, senderEmail: 'bob@example.com', senderName: 'Bob' },
        { ...mockEmail, senderEmail: 'charlie@example.com', senderName: 'Charlie' },
      ];

      const result = analyticsService.getTopSenders(emails, 2);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        email: 'alice@example.com',
        name: 'Alice',
        count: 2,
      });
      expect(result[1].count).toBeLessThanOrEqual(result[0].count);
    });

    it('should limit results to specified count', () => {
      const emails = Array(20).fill(null).map((_, i) => ({
        ...mockEmail,
        senderEmail: `sender${i}@example.com`,
        senderName: `Sender ${i}`,
      }));

      const result = analyticsService.getTopSenders(emails, 10);

      expect(result).toHaveLength(10);
    });

    it('should handle empty email list', () => {
      const result = analyticsService.getTopSenders([]);

      expect(result).toEqual([]);
    });
  });

  describe('getEmailsByDay', () => {
    it('should group emails by day', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const emails = [
        { ...mockEmail, receivedAt: today },
        { ...mockEmail, receivedAt: today },
        { ...mockEmail, receivedAt: yesterday },
        { ...mockEmail, receivedAt: twoDaysAgo },
      ];

      const result = analyticsService.getEmailsByDay(emails, 3);

      expect(result).toHaveLength(3);
      expect(result[0].count).toBe(2); // Today
      expect(result[1].count).toBe(1); // Yesterday
      expect(result[2].count).toBe(1); // Two days ago
    });

    it('should fill in days with no emails', () => {
      const today = new Date();
      const emails = [
        { ...mockEmail, receivedAt: today },
      ];

      const result = analyticsService.getEmailsByDay(emails, 7);

      expect(result).toHaveLength(7);
      // Should have 1 email for today and 0 for other days
      const totalEmails = result.reduce((sum, day) => sum + day.count, 0);
      expect(totalEmails).toBe(1);
    });
  });

  describe('getRecentActivity', () => {
    it('should return recent emails', () => {
      const emails = Array(10).fill(null).map((_, i) => ({
        ...mockEmail,
        id: i + 1,
        subject: `Email ${i + 1}`,
      }));

      const result = analyticsService.getRecentActivity(emails, 5);

      expect(result).toHaveLength(5);
      expect(result[0]).toMatchObject({
        id: expect.any(Number),
        subject: expect.any(String),
        senderEmail: expect.any(String),
        receivedAt: expect.any(Date),
      });
    });
  });

  describe('getAveragePerDay', () => {
    it('should calculate average emails per day', () => {
      const today = new Date();
      const emails = Array(30).fill(null).map((_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (i % 7)); // Distribute over 7 days
        return { ...mockEmail, receivedAt: date };
      });

      const result = analyticsService.getAveragePerDay(emails, 7);

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(30 / 7);
    });

    it('should handle empty email list', () => {
      const result = analyticsService.getAveragePerDay([]);

      expect(result).toBe(0);
    });
  });

  describe('getInsights', () => {
    it('should return complete insights', async () => {
      const mockEmails = [
        { ...mockEmail, bucketId: 1 },
        { ...mockEmail, bucketId: 1 },
      ];

      mockPrismaClient.email.findMany.mockResolvedValue(mockEmails);
      mockPrismaClient.bucket.findMany.mockResolvedValue([mockBucket]);
      mockPrismaClient.email.groupBy.mockResolvedValue([
        { bucketId: 1, _count: { id: 2 } },
      ]);

      const result = await analyticsService.getInsights();

      expect(result).toMatchObject({
        totalEmails: 2,
        bucketBreakdown: expect.any(Array),
        topSenders: expect.any(Array),
        emailsByDay: expect.any(Array),
        recentActivity: expect.any(Array),
        averagePerDay: expect.any(Number),
      });
    });

    it('should handle user with no emails', async () => {
      mockPrismaClient.email.findMany.mockResolvedValue([]);
      mockPrismaClient.bucket.findMany.mockResolvedValue([]);
      mockPrismaClient.email.groupBy.mockResolvedValue([]);

      const result = await analyticsService.getInsights();

      expect(result.totalEmails).toBe(0);
      expect(result.topSenders).toEqual([]);
      expect(result.averagePerDay).toBe(0);
    });
  });
});
