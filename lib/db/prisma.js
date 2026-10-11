import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

function createClient() {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL && prisma);
}
