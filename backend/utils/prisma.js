const { PrismaClient } = require("@prisma/client");

let prisma;

if (!global.prisma) {
  global.prisma = new PrismaClient({
    log: ["warn", "error"]
  });
}

prisma = global.prisma;

module.exports = prisma;
