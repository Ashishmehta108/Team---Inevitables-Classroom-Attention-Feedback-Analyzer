const request = require("supertest");
const { app } = require("../server");
const { createUsers } = require("./helpers");

describe("reports routes", () => {
  let teacher;
  let adminToken;
  let teacherToken;
  let sessionId;

  beforeAll(async () => {
    const users = await createUsers();
    teacher = users.teacher;
    teacherToken = users.teacherToken;
    adminToken = users.adminToken;

    const cls = await request(app)
      .post("/api/classes")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({ name: "History", subject: "WW2" });
    const session = await request(app)
      .post("/api/sessions")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({ classId: cls.body.id });
    sessionId = session.body.id;

    // Add one feedback to influence report
    await request(app)
      .post(`/api/feedback/${sessionId}`)
      .set("Authorization", `Bearer ${users.studentToken}`)
      .send({ rating: 5, comment: "Great" });
  });

  test("admin gets teacher reports with rating", async () => {
    const res = await request(app)
      .get("/api/reports/teachers")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const record = res.body.find((r) => r.teacherId === teacher.id);
    expect(record).toBeTruthy();
    expect(record.averageRating).toBeGreaterThan(0);
  });
});
