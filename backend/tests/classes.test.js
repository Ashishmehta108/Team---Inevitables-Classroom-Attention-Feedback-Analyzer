const request = require("supertest");
const { app } = require("../server");
const { createUsers } = require("./helpers");

describe("classes routes", () => {
  let teacherToken;
  let adminToken;
  let classId;

  beforeAll(async () => {
    const users = await createUsers();
    teacherToken = users.teacherToken;
    adminToken = users.adminToken;
  });

  test("teacher creates class", async () => {
    const res = await request(app)
      .post("/api/classes")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({ name: "Physics", subject: "Mechanics" });
    expect(res.status).toBe(201);
    classId = res.body.id;
  });

  test("teacher lists mine", async () => {
    const res = await request(app)
      .get("/api/classes/mine")
      .set("Authorization", `Bearer ${teacherToken}`);
    expect(res.status).toBe(200);
    expect(res.body.some((c) => c.id === classId)).toBe(true);
  });

  test("admin lists all", async () => {
    const res = await request(app)
      .get("/api/classes")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.some((c) => c.id === classId)).toBe(true);
  });
});
