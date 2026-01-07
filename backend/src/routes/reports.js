const express = require("express");
const prisma = require("../../utils/prisma");
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const { calculateBonus } = require("../utils/bonus");

const router = express.Router();

// Admin: aggregated teacher performance + bonus suggestion
router.get(
  "/teachers",
  auth(),
  requireRole("ADMIN"),
  async (req, res, next) => {
    try {
      const teachers = await prisma.user.findMany({
        where: { role: "TEACHER" },
        select: { id: true, name: true, email: true }
      });

      const result = [];

      for (const t of teachers) {
        const feedbackAgg = await prisma.feedback.aggregate({
          where: {
            session: {
              class: { teacherId: t.id }
            }
          },
          _avg: { rating: true },
          _count: { rating: true }
        });

        const avg = feedbackAgg._avg.rating || 0;
        const totalFeedback = feedbackAgg._count.rating || 0;
        const bonus = calculateBonus(avg);

        result.push({
          teacherId: t.id,
          name: t.name,
          email: t.email,
          averageRating: avg,
          totalFeedback,
          bonusAmount: bonus,
          bonusStatus: bonus === null ? "manual_review" : "computed"
        });
      }

      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;

