const express = require("express");
const prisma = require("../../utils/prisma");
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const { ioEmit } = require("../utils/realtime");

const router = express.Router();

// Student posts doubt anonymously (no identity in payload)
router.post("/:sessionId", auth(), requireRole("STUDENT"), async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { content } = req.body || {};
    if (!content) return res.status(400).json({ error: "content required" });

    const doubt = await prisma.doubt.create({
      data: {
        sessionId,
        studentId: req.user.id,
        content
      }
    });

    ioEmit(sessionId, "doubt:new", {
      id: doubt.id,
      content: doubt.content,
      createdAt: doubt.createdAt
    });

    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Teacher/admin view doubts for a session (no student info)
router.get(
  "/:sessionId",
  auth(),
  requireRole("TEACHER", "ADMIN"),
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const doubts = await prisma.doubt.findMany({
        where: { sessionId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          content: true,
          isResolved: true,
          createdAt: true
        }
      });
      res.json(doubts);
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;

