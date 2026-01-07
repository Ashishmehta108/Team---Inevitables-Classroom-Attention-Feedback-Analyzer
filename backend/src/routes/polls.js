const express = require("express");
const prisma = require("../../utils/prisma");
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const { ioEmit } = require("../utils/realtime");

const router = express.Router();

// Create poll with options (teacher), enforce 1 active per session
router.post("/", auth(), requireRole("TEACHER"), async (req, res, next) => {
  try {
    const { sessionId, question, options } = req.body || {};
    if (!sessionId || !question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: "sessionId, question, 2+ options required" });
    }

    // Close existing active poll for session
    await prisma.poll.updateMany({
      where: { sessionId, isActive: true },
      data: { isActive: false }
    });

    const poll = await prisma.poll.create({
      data: {
        sessionId,
        teacherId: req.user.id,
        question,
        options: {
          create: options.map((text) => ({ text }))
        }
      },
      include: { options: true }
    });

    ioEmit(sessionId, "poll:new", {
      id: poll.id,
      question: poll.question,
      options: poll.options.map((o) => ({ id: o.id, text: o.text }))
    });

    res.status(201).json(poll);
  } catch (e) {
    next(e);
  }
});

// Student responds to poll (one participation per student)
router.post("/:pollId/respond", auth(), requireRole("STUDENT"), async (req, res, next) => {
  try {
    const { optionId } = req.body || {};
    const { pollId } = req.params;
    if (!optionId) return res.status(400).json({ error: "optionId required" });

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true }
    });
    if (!poll || !poll.isActive) {
      return res.status(400).json({ error: "Poll not active" });
    }
    const option = poll.options.find((o) => o.id === optionId);
    if (!option) return res.status(400).json({ error: "Invalid option" });

    await prisma.pollResponse.upsert({
      where: {
        pollId_studentId: {
          pollId,
          studentId: req.user.id
        }
      },
      update: { optionId },
      create: {
        pollId,
        optionId,
        studentId: req.user.id
      }
    });

    const counts = await prisma.pollResponse.groupBy({
      by: ["optionId"],
      where: { pollId },
      _count: { optionId: true }
    });

    const payload = counts.map((c) => ({
      optionId: c.optionId,
      count: c._count.optionId
    }));

    ioEmit(poll.sessionId, "poll:update", { pollId, results: payload });

    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Teacher/admin/student get aggregate poll results (no student identities)
router.get("/:pollId/results", auth(), requireRole("TEACHER", "ADMIN", "STUDENT"), async (req, res, next) => {
  try {
    const { pollId } = req.params;
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true }
    });
    if (!poll) return res.status(404).json({ error: "Poll not found" });

    const counts = await prisma.pollResponse.groupBy({
      by: ["optionId"],
      where: { pollId },
      _count: { optionId: true }
    });

    const results = poll.options.map((o) => ({
      optionId: o.id,
      text: o.text,
      count: counts.find((c) => c.optionId === o.id)?._count.optionId || 0
    }));

    res.json({
      poll: { id: poll.id, question: poll.question },
      results
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;

