import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { mockAuthRequest, mockPrismaClient } from './setup.js';

// Mock dependencies
jest.unstable_mockModule('../db/prisma.js', () => ({
  prisma: mockPrismaClient,
}));

const { getCurrentUser, logout } = await import('../controllers/auth.controller.js');

describe('Auth Controller', () => {
  let req, res;
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    req = mockAuthRequest();
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('getCurrentUser', () => {
    it('should return 401 when not authenticated', async () => {
      req.isAuthenticated = jest.fn().mockReturnValue(false);

      await getCurrentUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      req.logout = jest.fn((callback) => callback());

      await logout(req, res);

      expect(req.logout).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully',
      });
    });

    it('should handle logout errors', async () => {
      req.logout = jest.fn((callback) => callback(new Error('Logout failed')));

      await logout(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
