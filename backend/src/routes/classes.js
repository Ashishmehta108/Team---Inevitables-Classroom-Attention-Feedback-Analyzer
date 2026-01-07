const express = require("express");
const prisma = require("../../utils/prisma");
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");

const router = express.Router();

// Create class (teacher)
router.post("/", auth(), requireRole("TEACHER"), async (req, res, next) => {
  try {
    const { name, subject } = req.body || {};
    if (!name || !subject) {
      return res.status(400).json({ error: "Name and subject required" });
    }
    const cls = await prisma.class.create({
      data: {
        name,
        subject,
        teacherId: req.user.id
      }
    });
    res.status(201).json(cls);
  } catch (e) {
    next(e);
  }
});

// List classes for current teacher
router.get("/mine", auth(), requireRole("TEACHER"), async (req, res, next) => {
  try {
    const classes = await prisma.class.findMany({
      where: { teacherId: req.user.id }
    });
    res.json(classes);
  } catch (e) {
    next(e);
  }
});

// Admin list all classes (no student info)
router.get("/", auth(), requireRole("ADMIN"), async (req, res, next) => {
  try {
    const classes = await prisma.class.findMany({
      include: { teacher: { select: { id: true, name: true, email: true } } }
    });
    res.json(classes);
  } catch (e) {
    next(e);
  }
});

module.exports = router;

