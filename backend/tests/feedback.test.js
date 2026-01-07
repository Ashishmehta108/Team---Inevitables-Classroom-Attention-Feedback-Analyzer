const request = require("supertest");
const { app } = require("../server");
const { createUsers } = require("./helpers");

describe("feedback routes", () => {
  let studentToken;
  let adminToken;
  let sessionId;

  beforeAll(async () => {
    const users = await createUsers();
    studentToken = users.studentToken;
    adminToken = users.adminToken;
    const cls = await request(app)
      .post("/api/classes")
      .set("Authorization", `Bearer ${users.teacherToken}`)
      .send({ name: "Music", subject: "Rhythm" });
    const session = await request(app)
      .post("/api/sessions")
      .set("Authorization", `Bearer ${users.teacherToken}`)
      .send({ classId: cls.body.id });
    sessionId = session.body.id;
  });

  test("student submits feedback", async () => {
    const res = await request(app)
      .post(`/api/feedback/${sessionId}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ rating: 4, comment: "Nice" });
    expect(res.status).toBe(201);
  });

  test("admin reads aggregate", async () => {
    const res = await request(app)
      .get(`/api/feedback/session/${sessionId}/aggregate`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.totalFeedback).toBeGreaterThanOrEqual(1);
  });
});
