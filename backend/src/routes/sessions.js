const express = require("express");
const prisma = require("../../utils/prisma");
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");

const router = express.Router();

// Create session for a class, auto-set attendance window 5 minutes
router.post("/", auth(), requireRole("TEACHER"), async (req, res, next) => {
  try {
    const { classId, startsAt } = req.body || {};
    if (!classId) {
      return res.status(400).json({ error: "classId required" });
    }
    const start = startsAt ? new Date(startsAt) : new Date();
    const attendanceClosesAt = new Date(start.getTime() + 5 * 60 * 1000);
    const session = await prisma.session.create({
      data: {
        classId,
        startsAt: start,
        attendanceClosesAt
      }
    });
    res.status(201).json(session);
  } catch (e) {
    next(e);
  }
});

// Get sessions for a class (teacher or admin)
router.get(
  "/by-class/:classId",
  auth(),
  requireRole("TEACHER", "ADMIN"),
  async (req, res, next) => {
    try {
      const sessions = await prisma.session.findMany({
        where: { classId: req.params.classId }
      });
      res.json(sessions);
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;

