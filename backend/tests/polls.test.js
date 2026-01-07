const request = require("supertest");
const { app } = require("../server");
const { createUsers } = require("./helpers");

describe("poll routes", () => {
  let teacherToken;
  let studentToken;
  let classId;
  let sessionId;
  let pollId;

  beforeAll(async () => {
    const users = await createUsers();
    teacherToken = users.teacherToken;
    studentToken = users.studentToken;
    const cls = await request(app)
      .post("/api/classes")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({ name: "Geo", subject: "Maps" });
    classId = cls.body.id;
    const session = await request(app)
      .post("/api/sessions")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({ classId });
    sessionId = session.body.id;
  });

  test("teacher creates poll", async () => {
    const res = await request(app)
      .post("/api/polls")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({
        sessionId,
        question: "Ready?",
        options: ["Yes", "No"]
      });
    expect(res.status).toBe(201);
    pollId = res.body.id;
  });

  test("student responds", async () => {
    const optionId = await getPollFirstOption();
    const res = await request(app)
      .post(`/api/polls/${pollId}/respond`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ optionId });
    expect(res.status).toBe(201);
  });

  test("teacher reads results", async () => {
    const res = await request(app)
      .get(`/api/polls/${pollId}/results`)
      .set("Authorization", `Bearer ${teacherToken}`);
    expect(res.status).toBe(200);
    expect(res.body.results.some((r) => r.count >= 0)).toBe(true);
  });

  async function getPollFirstOption() {
    const poll = await request(app)
      .get(`/api/polls/${pollId}/results`)
      .set("Authorization", `Bearer ${teacherToken}`);
    return poll.body.results[0].optionId;
  }

});
