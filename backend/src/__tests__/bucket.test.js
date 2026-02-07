import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { mockAuthRequest, mockBucket, mockPrismaClient } from './setup.js';

// Mock dependencies
jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
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
    it('should return all user buckets', async () => {
      const mockBuckets = [mockBucket, { ...mockBucket, id: 2, name: 'Another Bucket' }];
      mockPrismaClient.bucket.findMany.mockResolvedValue(mockBuckets);
      mockPrismaClient.email.groupBy.mockResolvedValue([
        { bucketId: 1, _count: { id: 5 } },
        { bucketId: 2, _count: { id: 3 } },
      ]);

      await getBuckets(req, res);

      expect(mockPrismaClient.bucket.findMany).toHaveBeenCalledWith({
        where: { userId: req.user.id },
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ id: 1, emailCount: 5 }),
          expect.objectContaining({ id: 2, emailCount: 3 }),
        ]),
      });
    });

    it('should handle empty bucket list', async () => {
      mockPrismaClient.bucket.findMany.mockResolvedValue([]);
      mockPrismaClient.email.groupBy.mockResolvedValue([]);

      await getBuckets(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });
  });

  describe('createBucket', () => {
    it('should create a new bucket', async () => {
      req.body = {
        name: 'New Bucket',
        description: 'Test description',
        color: '#FF5733',
      };

      mockPrismaClient.bucket.create.mockResolvedValue({
        ...mockBucket,
        name: 'New Bucket',
      });

      await createBucket(req, res);

      expect(mockPrismaClient.bucket.create).toHaveBeenCalledWith({
        data: {
          userId: req.user.id,
          name: 'New Bucket',
          description: 'Test description',
          color: '#FF5733',
          isDefault: false,
        },
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          name: 'New Bucket',
        }),
      });
    });

    it('should handle duplicate bucket names', async () => {
      req.body = { name: 'Existing Bucket' };

      mockPrismaClient.bucket.create.mockRejectedValue({
        code: 'P2002',
        message: 'Unique constraint failed',
      });

      await createBucket(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'A bucket with this name already exists',
      });
    });
  });

  describe('updateBucket', () => {
    it('should update an existing bucket', async () => {
      req.params = { id: '1' };
      req.body = { name: 'Updated Bucket' };

      mockPrismaClient.bucket.update.mockResolvedValue({
        ...mockBucket,
        name: 'Updated Bucket',
      });

      await updateBucket(req, res);

      expect(mockPrismaClient.bucket.update).toHaveBeenCalledWith({
        where: { id: 1, userId: req.user.id },
        data: { name: 'Updated Bucket' },
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          name: 'Updated Bucket',
        }),
      });
    });

    it('should prevent updating default buckets', async () => {
      req.params = { id: '1' };
      req.body = { name: 'Updated Name' };

      mockPrismaClient.bucket.findFirst.mockResolvedValue({
        ...mockBucket,
        isDefault: true,
      });

      await updateBucket(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot modify default buckets',
      });
    });
  });

  describe('deleteBucket', () => {
    it('should delete a bucket', async () => {
      req.params = { id: '1' };

      mockPrismaClient.bucket.findFirst.mockResolvedValue(mockBucket);
      mockPrismaClient.email.updateMany.mockResolvedValue({ count: 5 });
      mockPrismaClient.bucket.delete.mockResolvedValue(mockBucket);

      await deleteBucket(req, res);

      expect(mockPrismaClient.email.updateMany).toHaveBeenCalledWith({
        where: { bucketId: 1 },
        data: { bucketId: null },
      });

      expect(mockPrismaClient.bucket.delete).toHaveBeenCalledWith({
        where: { id: 1, userId: req.user.id },
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Bucket deleted successfully',
      });
    });

    it('should prevent deleting default buckets', async () => {
      req.params = { id: '1' };

      mockPrismaClient.bucket.findFirst.mockResolvedValue({
        ...mockBucket,
        isDefault: true,
      });

      await deleteBucket(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot delete default buckets',
      });
    });
  });
});
