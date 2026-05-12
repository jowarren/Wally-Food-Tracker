import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from './generated/prisma/client';

const globalForPrisma = global as unknown as { _prisma: PrismaClient | undefined };

function getClient(): PrismaClient {
  if (!globalForPrisma._prisma) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL environment variable is not set');
    const adapter = new PrismaNeon({ connectionString: url });
    globalForPrisma._prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma._prisma;
}

// Proxy defers client creation until the first DB call so that importing
// this module during Next.js build (when DATABASE_URL isn't available) doesn't throw.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
