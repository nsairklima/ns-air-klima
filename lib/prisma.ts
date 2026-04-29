import { PrismaClient } from '@prisma/client';

// TESZT: Ha így sem megy, akkor a Neon blokkolja a portot!
const testUrl = "postgresql://neondb_owner:npg_YniXAdMO0Ns8@ep-shy-rice-alkl3o0w-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true";

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: testUrl,
    },
  },
});
