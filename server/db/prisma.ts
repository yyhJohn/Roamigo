import { PrismaClient } from '@prisma/client';

let sharedPrisma: PrismaClient | undefined;

export function getPrismaClient(databaseUrl?: string): PrismaClient {
  if (!sharedPrisma) {
    sharedPrisma = new PrismaClient(
      databaseUrl
        ? {
            datasources: {
              db: { url: databaseUrl },
            },
          }
        : undefined,
    );
  }
  return sharedPrisma;
}

export function createPrismaClient(databaseUrl: string): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
  });
}

export async function disconnectPrisma(): Promise<void> {
  if (sharedPrisma) {
    await sharedPrisma.$disconnect();
    sharedPrisma = undefined;
  }
}
