import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { mockAuthRequest, mockBucket, mockPrismaClient } from './setup.js';

// Mock dependencies
jest.unstable_mockModule('../db/prisma.js', () => ({
  prisma: mockPrismaClient,
}));

const { getBuckets, createBucket, updateBucket, deleteBucket } = await import('../controllers/bucket.controller.js');

describe('Bucket Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = mockAuthRequest();
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('getBuckets', () => {
    it('should return all buckets for user', async () => {
      const mockBuckets = [mockBucket, { ...mockBucket, id: 2, name: 'Can Wait' }];
      mockPrismaClient.bucket.findMany.mockResolvedValue(mockBuckets);

      await getBuckets(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockBuckets,
      });
    });
  });

  describe('createBucket', () => {
    it('should create a new bucket', async () => {
      const newBucket = { name: 'New Bucket', description: 'Test', color: '#FF0000' };
      req.body = newBucket;

      // Mock that bucket doesn't exist
      mockPrismaClient.bucket.findFirst.mockResolvedValue(null);

      mockPrismaClient.bucket.create.mockResolvedValue({
        ...mockBucket,
        ...newBucket,
      });

      await createBucket(req, res);

      expect(mockPrismaClient.bucket.create).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining(newBucket),
      });
    });
  });
});
