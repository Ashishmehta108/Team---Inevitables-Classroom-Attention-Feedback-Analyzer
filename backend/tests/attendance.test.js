const request = require("supertest");
const { app } = require("../server");
const { createUsers } = require("./helpers");

describe("attendance routes", () => {
  let teacherToken;
  let studentToken;
  let classId;
  let sessionId;

  beforeAll(async () => {
    const users = await createUsers();
    teacherToken = users.teacherToken;
    studentToken = users.studentToken;
    const cls = await request(app)
      .post("/api/classes")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({ name: "Bio", subject: "Cells" });
    classId = cls.body.id;
    const session = await request(app)
      .post("/api/sessions")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({ classId });
    sessionId = session.body.id;
  });

  test("student marks attendance within window", async () => {
    const res = await request(app)
      .post(`/api/attendance/${sessionId}`)
      .set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(201);
  });

  test("teacher sees count", async () => {
    const res = await request(app)
      .get(`/api/attendance/${sessionId}/count`)
      .set("Authorization", `Bearer ${teacherToken}`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
  });
});
