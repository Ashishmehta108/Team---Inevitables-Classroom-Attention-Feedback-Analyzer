const request = require("supertest");
const { app } = require("../server");
const { createUsers } = require("./helpers");

describe("doubts routes", () => {
  let teacherToken;
  let studentToken;
  let sessionId;

  beforeAll(async () => {
    const users = await createUsers();
    teacherToken = users.teacherToken;
    studentToken = users.studentToken;
    const cls = await request(app)
      .post("/api/classes")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({ name: "Art", subject: "Drawing" });
    const session = await request(app)
      .post("/api/sessions")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({ classId: cls.body.id });
    sessionId = session.body.id;
  });

  test("student posts doubt", async () => {
    const res = await request(app)
      .post(`/api/doubts/${sessionId}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ content: "Need shading tips" });
    expect(res.status).toBe(201);
  });

  test("teacher lists doubts", async () => {
    const res = await request(app)
      .get(`/api/doubts/${sessionId}`)
      .set("Authorization", `Bearer ${teacherToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});
