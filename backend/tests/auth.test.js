const request = require("supertest");
const { app } = require("../server");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

describe("auth routes", () => {
  beforeAll(async () => {
    await prisma.user.create({
      data: {
        email: "teacher@test.com",
        passwordHash: await bcrypt.hash("password123", 10),
        role: "TEACHER"
      }
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: "teacher@test.com" } });
  });

  it("creates anonymous student and returns token", async () => {
    const res = await request(app).post("/api/auth/anonymous");
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.role).toBe("STUDENT");
    expect(res.body.anonymousCode).toMatch(/^STU-/);
  });

  it("logs in teacher with email/password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "teacher@test.com", password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe("TEACHER");
  });
});
