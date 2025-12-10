// Prisma Database Client (Optional)
// This is a stub that works whether Prisma is configured or not.
// The app uses mock data by default and database features are optional.

// Check if Prisma is available (generated)
let PrismaClientModule: any = null;
try {
  // Dynamic import to avoid build errors when Prisma isn't generated
  PrismaClientModule = require('@prisma/client');
} catch {
  // Prisma not generated - this is fine, we'll use mock data
  console.warn('Prisma client not found. Database features disabled. Using mock data.');
}

// Type for PrismaClient (or null if not available)
type PrismaClientType = any;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined;
};

export const prisma: PrismaClientType | null = PrismaClientModule
  ? (globalForPrisma.prisma ??
      new PrismaClientModule.PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      }))
  : null;

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}

export default prisma;

// Check if database is available
export function isDatabaseAvailable(): boolean {
  return prisma !== null;
}

// Helper: Safe database operation wrapper
export async function withDatabase<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  if (!prisma) {
    return fallback;
  }
  try {
    return await operation();
  } catch (error) {
    console.error('Database operation failed:', error);
    return fallback;
  }
}
