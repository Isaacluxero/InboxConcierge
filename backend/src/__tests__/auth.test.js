import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { getCurrentUser, logout } from '../controllers/auth.controller.js';
import { mockAuthRequest, mockUnauthRequest, mockUser, mockPrismaClient } from './setup.js';

// Mock Prisma
jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
}));

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock response object
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('getCurrentUser', () => {
    it('should return user data when authenticated', async () => {
      req = mockAuthRequest();
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        createdAt: mockUser.createdAt,
      });

      await getCurrentUser(req, res);

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
        }),
      });
    });

    it('should return 401 when not authenticated', async () => {
      req = mockUnauthRequest();

      await getCurrentUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated',
      });
    });

    it('should handle database errors', async () => {
      req = mockAuthRequest();
      mockPrismaClient.user.findUnique.mockRejectedValue(new Error('Database error'));

      await getCurrentUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to get user',
      });
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      req = {
        logout: jest.fn((callback) => callback(null)),
      };

      await logout(req, res);

      expect(req.logout).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully',
      });
    });

    it('should handle logout errors', async () => {
      req = {
        logout: jest.fn((callback) => callback(new Error('Logout failed'))),
      };

      await logout(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Logout failed',
      });
    });
  });
});
