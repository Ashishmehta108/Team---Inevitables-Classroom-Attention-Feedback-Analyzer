const request = require("supertest");
const { app } = require("../server");
const { createUsers } = require("./helpers");

describe("sessions routes", () => {
  let teacherToken;
  let classId;

  beforeAll(async () => {
    const users = await createUsers();
    teacherToken = users.teacherToken;
    const res = await request(app)
      .post("/api/classes")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({ name: "Chemistry", subject: "Organic" });
    classId = res.body.id;
  });

  test("teacher creates session", async () => {
    const res = await request(app)
      .post("/api/sessions")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({ classId });
    expect(res.status).toBe(201);
  });

  test("teacher lists sessions by class", async () => {
    const res = await request(app)
      .get(`/api/sessions/by-class/${classId}`)
      .set("Authorization", `Bearer ${teacherToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
