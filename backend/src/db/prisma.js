import { PrismaClient } from '@prisma/client';

/**
 * Prisma client instance
 * Shared across the application
 */
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

/**
 * Graceful shutdown handler
 * Disconnects Prisma client when process exits
 */
export const disconnectPrisma = async () => {
  await prisma.$disconnect();
};
