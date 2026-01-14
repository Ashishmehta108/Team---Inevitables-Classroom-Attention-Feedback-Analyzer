const express = require("express");
const prisma = require("../../utils/prisma");
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");

const router = express.Router();

// Student submits anonymous feedback (1-5)
router.post("/:sessionId", auth(), requireRole("STUDENT"), async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { rating, comment } = req.body || {};
    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return res.status(400).json({ error: "rating must be integer 1-5" });
    }

    await prisma.feedback.upsert({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId: req.user.id
        }
      },
      update: { rating: r, comment },
      create: {
        sessionId,
        studentId: req.user.id,
        rating: r,
        comment
      }
    });

    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Admin gets aggregated feedback per session (no identities)
router.get(
  "/session/:sessionId/aggregate",
  auth(),
  requireRole("ADMIN"),
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const agg = await prisma.feedback.aggregate({
        where: { sessionId },
        _avg: { rating: true },
        _count: { rating: true }
      });
      res.json({
        sessionId,
        averageRating: agg._avg.rating || 0,
        totalFeedback: agg._count.rating || 0
      });
    } catch (e) {
      next(e);
    }
  }
);

// Admin gets feedback comments for a session (anonymous)
router.get(
  "/session/:sessionId/comments",
  auth(),
  requireRole("ADMIN"),
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;

      const comments = await prisma.feedback.findMany({
        where: {
          sessionId,
          comment: {
            not: null
          }
        },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true
        },
        orderBy: {
          createdAt: "desc"
        }
      });

      res.json(comments);
    } catch (e) {
      next(e);
    }
  }
);


module.exports = router;

