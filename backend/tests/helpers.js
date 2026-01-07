const jwt = require("jsonwebtoken");
const prisma = require("../utils/prisma");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

function tokenFor(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      anonymousCode: user.anonymousCode || null
    },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
}

async function createUsers() {
  const teacher = await prisma.user.create({
    data: {
      email: `teacher-${Date.now()}@test.com`,
      passwordHash: "hash",
      role: "TEACHER"
    }
  });
  const admin = await prisma.user.create({
    data: {
      email: `admin-${Date.now()}@test.com`,
      passwordHash: "hash",
      role: "ADMIN"
    }
  });
  const student = await prisma.user.create({
    data: {
      role: "STUDENT",
      passwordHash: "hash",
      anonymousCode: `STU-${Date.now()}`
    }
  });

  return {
    teacher,
    admin,
    student,
    teacherToken: tokenFor(teacher),
    adminToken: tokenFor(admin),
    studentToken: tokenFor(student)
  };
}

module.exports = { prisma, tokenFor, createUsers };
