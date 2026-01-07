const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../../utils/prisma");

const router = express.Router();

function generateStudentCode() {
  return `STU-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      anonymousCode: user.anonymousCode || null
    },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "8h" }
  );
}

// Email/password login for teacher/admin
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const token = signToken(user);
    res.json({
      token,
      user: { id: user.id, role: user.role, name: user.name }
    });
  } catch (e) {
    next(e);
  }
});

// Anonymous student entry: create new anonymous student
router.post("/anonymous", async (req, res, next) => {
  try {
    const code = generateStudentCode();
    const passwordHash = await bcrypt.hash(code, 10);
    const user = await prisma.user.create({
      data: {
        role: "STUDENT",
        passwordHash,
        anonymousCode: code
      }
    });
    const token = signToken(user);
    res.json({
      token,
      anonymousCode: code,
      role: "STUDENT"
    });
  } catch (e) {
    next(e);
  }
});

// Anonymous student sign-in with existing code
router.post("/anonymous/login", async (req, res, next) => {
  try {
    const { code } = req.body || {};
    if (!code) {
      return res.status(400).json({ error: "anonymous code required" });
    }
    const user = await prisma.user.findFirst({
      where: { role: "STUDENT", anonymousCode: code }
    });
    if (!user) {
      return res.status(401).json({ error: "Invalid anonymous code" });
    }
    const ok = await bcrypt.compare(code, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid anonymous code" });
    }
    const token = signToken(user);
    res.json({
      token,
      anonymousCode: user.anonymousCode,
      role: "STUDENT"
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;

