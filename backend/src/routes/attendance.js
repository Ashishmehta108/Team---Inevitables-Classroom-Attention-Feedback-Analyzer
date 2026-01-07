const express = require("express");
const prisma = require("../../utils/prisma");
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const { ioEmit } = require("../utils/realtime");

const router = express.Router();

// Student marks attendance for a session (within 5-minute window)
router.post("/:sessionId", auth(), requireRole("STUDENT"), async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    const now = new Date();
    if (now > session.attendanceClosesAt) {
      return res.status(400).json({ error: "Attendance window closed" });
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId: req.user.id
        }
      },
      update: {},
      create: {
        sessionId,
        studentId: req.user.id
      }
    });

    const count = await prisma.attendance.count({ where: { sessionId } });
    ioEmit(sessionId, "attendance:update", { sessionId, count });

    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Teacher sees aggregate attendance count only
router.get(
  "/:sessionId/count",
  auth(),
  requireRole("TEACHER", "ADMIN"),
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const count = await prisma.attendance.count({ where: { sessionId } });
      res.json({ sessionId, count });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;

