import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  // A sémádban POSTGRES_URL szerepel, így itt is azt kell használnunk
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.POSTGRES_URL,
      },
    },
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

/**
 * KRITIKUS JAVÍTÁS:
 * Megnézzük, hogy a Next.js éppen build fázisban van-e.
 * Ha igen, egy üres objektumot adunk vissza a valódi kliens helyett,
 * így a Vercel build nem fog elszállni az adatbázis-kapcsolat hiánya miatt.
 */
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

export const prisma = 
  globalForPrisma.prisma ?? 
  (isBuildPhase ? ({} as any) : prismaClientSingleton());

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
