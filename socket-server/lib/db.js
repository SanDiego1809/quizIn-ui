const { PrismaClient } = require("@prisma/client");

let prisma = null;

function getPrisma() {
  if (!process.env.DATABASE_URL) return null;
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL && getPrisma());
}

module.exports = {
  getPrisma,
  isDatabaseConfigured,
};
