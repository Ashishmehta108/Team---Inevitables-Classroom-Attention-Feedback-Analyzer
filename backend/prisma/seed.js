const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const prisma = new PrismaClient();

function generateStudentCode() {
  return `STU-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

async function main() {
  const password = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin",
      role: "ADMIN",
      passwordHash: password
    }
  });

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@example.com" },
    update: {},
    create: {
      email: "teacher@example.com",
      name: "Teacher One",
      role: "TEACHER",
      passwordHash: password
    }
  });

  const students = await Promise.all(
    Array.from({ length: 3 }).map((_, idx) =>
      prisma.user.create({
        data: {
          role: "STUDENT",
          passwordHash: password,
          anonymousCode: generateStudentCode(),
          name: `Student ${idx + 1}`
        }
      })
    )
  );

  const classOne = await prisma.class.create({
    data: {
      name: "Math 101",
      subject: "Algebra",
      teacherId: teacher.id
    }
  });

  // create enrollments per-student to stay compatible with sqlite
  for (const s of students) {
    await prisma.classEnrollment.create({
      data: { classId: classOne.id, studentId: s.id }
    });
  }

  const session = await prisma.session.create({
    data: {
      classId: classOne.id,
      startsAt: new Date(),
      attendanceClosesAt: new Date(Date.now() + 5 * 60 * 1000)
    }
  });

  await prisma.poll.create({
    data: {
      sessionId: session.id,
      teacherId: teacher.id,
      question: "How confident are you with today's topic?",
      options: {
        create: [
          { text: "Very confident" },
          { text: "Somewhat confident" },
          { text: "Not confident" }
        ]
      }
    }
  });

  for (const [idx, s] of students.entries()) {
    await prisma.feedback.create({
      data: {
        sessionId: session.id,
        studentId: s.id,
        rating: 5 - idx,
        comment: "Great class!"
      }
    });
  }

  await prisma.doubt.create({
    data: {
      sessionId: session.id,
      studentId: students[0].id,
      content: "Can you explain quadratic formula again?"
    }
  });

  console.log({ admin, teacher, studentsCount: students.length, classOne, session });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
