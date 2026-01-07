const request = require("supertest");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { app } = require("../server");

const prisma = new PrismaClient();
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

describe("end-to-end classroom flow", () => {
  let teacher;
  let admin;
  let student;
  let teacherToken;
  let adminToken;
  let studentToken;
  let classId;
  let sessionId;
  let pollId;

  beforeAll(async () => {
    // Clean tables
    await prisma.attendance.deleteMany();
    await prisma.pollResponse.deleteMany();
    await prisma.pollOption.deleteMany();
    await prisma.poll.deleteMany();
    await prisma.feedback.deleteMany();
    await prisma.doubt.deleteMany();
    await prisma.session.deleteMany();
    await prisma.classEnrollment.deleteMany();
    await prisma.class.deleteMany();
    await prisma.user.deleteMany();

    teacher = await prisma.user.create({
      data: {
        email: `teacher-${Date.now()}@test.com`,
        passwordHash: "hash",
        role: "TEACHER"
      }
    });
    admin = await prisma.user.create({
      data: {
        email: `admin-${Date.now()}@test.com`,
        passwordHash: "hash",
        role: "ADMIN"
      }
    });
    student = await prisma.user.create({
      data: {
        role: "STUDENT",
        passwordHash: "hash",
        anonymousCode: `STU-${Date.now()}`
      }
    });

    teacherToken = tokenFor(teacher);
    adminToken = tokenFor(admin);
    studentToken = tokenFor(student);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("teacher creates class and lists mine", async () => {
    const res = await request(app)
      .post("/api/classes")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({ name: "Math 101", subject: "Algebra" });

    expect(res.status).toBe(201);
    classId = res.body.id;

    const mine = await request(app)
      .get("/api/classes/mine")
      .set("Authorization", `Bearer ${teacherToken}`);

    expect(mine.status).toBe(200);
    expect(mine.body.length).toBe(1);
  });

  test("admin lists classes", async () => {
    const res = await request(app)
      .get("/api/classes")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body[0].id).toBe(classId);
  });

  test("teacher creates session and student marks attendance", async () => {
    const createSession = await request(app)
      .post("/api/sessions")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({ classId });

    expect(createSession.status).toBe(201);
    sessionId = createSession.body.id;

    const mark = await request(app)
      .post(`/api/attendance/${sessionId}`)
      .set("Authorization", `Bearer ${studentToken}`);
    expect(mark.status).toBe(201);

    const count = await request(app)
      .get(`/api/attendance/${sessionId}/count`)
      .set("Authorization", `Bearer ${teacherToken}`);
    expect(count.status).toBe(200);
    expect(count.body.count).toBe(1);
  });

  test("poll create, respond, and results", async () => {
    const createPoll = await request(app)
      .post("/api/polls")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({
        sessionId,
        question: "How is the pace?",
        options: ["Fast", "Just right", "Slow"]
      });
    expect(createPoll.status).toBe(201);
    pollId = createPoll.body.id;
    const optionId = createPoll.body.options[0].id;

    const respond = await request(app)
      .post(`/api/polls/${pollId}/respond`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ optionId });
    expect(respond.status).toBe(201);

    const results = await request(app)
      .get(`/api/polls/${pollId}/results`)
      .set("Authorization", `Bearer ${teacherToken}`);
    expect(results.status).toBe(200);
    expect(results.body.results.find((r) => r.optionId === optionId).count).toBe(1);
  });

  test("doubt flow", async () => {
    const createDoubt = await request(app)
      .post(`/api/doubts/${sessionId}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ content: "Please recap previous topic" });
    expect(createDoubt.status).toBe(201);

    const listDoubts = await request(app)
      .get(`/api/doubts/${sessionId}`)
      .set("Authorization", `Bearer ${teacherToken}`);
    expect(listDoubts.status).toBe(200);
    expect(listDoubts.body.length).toBe(1);
  });

  test("feedback and admin aggregate/report", async () => {
    const feedback = await request(app)
      .post(`/api/feedback/${sessionId}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ rating: 5, comment: "Great!" });
    expect(feedback.status).toBe(201);

    const aggregate = await request(app)
      .get(`/api/feedback/session/${sessionId}/aggregate`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(aggregate.status).toBe(200);
    expect(aggregate.body.averageRating).toBe(5);
    expect(aggregate.body.totalFeedback).toBe(1);

    const reports = await request(app)
      .get("/api/reports/teachers")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(reports.status).toBe(200);
    const teacherReport = reports.body.find((r) => r.teacherId === teacher.id);
    expect(teacherReport.averageRating).toBe(5);
  });
});
