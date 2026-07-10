import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient } from "@/generated/prisma/client";

declare global {
  var __mesaPrisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to initialize Prisma Client.");
  }

  return new PrismaClient({
    adapter: new PrismaMssql(databaseUrl),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalThis.__mesaPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__mesaPrisma = prisma;
}
