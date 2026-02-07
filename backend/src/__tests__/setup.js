import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret-key';
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/auth/google/callback';
process.env.ANTHROPIC_API_KEY = 'test-api-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.ALLOWED_ORIGINS = 'http://localhost:5173';

// Mock Prisma Client
export const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  email: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  bucket: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $disconnect: jest.fn(),
};

// Mock user for testing
export const mockUser = {
  id: 1,
  email: 'test@example.com',
  googleId: '123456789',
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  tokenExpiry: new Date(Date.now() + 3600000),
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock bucket for testing
export const mockBucket = {
  id: 1,
  userId: 1,
  name: 'Test Bucket',
  description: 'Test bucket description',
  color: '#FF5733',
  isDefault: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock email for testing
export const mockEmail = {
  id: 1,
  userId: 1,
  gmailId: 'gmail-123',
  subject: 'Test Email',
  senderEmail: 'sender@example.com',
  senderName: 'Test Sender',
  preview: 'This is a test email',
  bodySnippet: 'Test email body',
  receivedAt: new Date(),
  bucketId: 1,
  isRead: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Helper to create authenticated session
export const createAuthSession = (userId = 1) => ({
  passport: { user: userId },
  user: mockUser,
});

// Helper to mock authenticated request
export const mockAuthRequest = (overrides = {}) => ({
  user: mockUser,
  isAuthenticated: () => true,
  session: createAuthSession(),
  ...overrides,
});

// Helper to mock unauthenticated request
export const mockUnauthRequest = (overrides = {}) => ({
  user: null,
  isAuthenticated: () => false,
  session: {},
  ...overrides,
});

export default {
  mockPrismaClient,
  mockUser,
  mockBucket,
  mockEmail,
  createAuthSession,
  mockAuthRequest,
  mockUnauthRequest,
};
