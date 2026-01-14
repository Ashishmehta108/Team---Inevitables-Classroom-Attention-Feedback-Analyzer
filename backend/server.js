// Entry point for Express + Socket.io backend
const dotenv = require("dotenv");
// load default .env; optionally load ./env if present
dotenv.config({ path: ".env" });
dotenv.config({ path: "env" });

const http = require("http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { Server } = require("socket.io");

const authRoutes = require("./src/routes/auth");
const classRoutes = require("./src/routes/classes");
const sessionRoutes = require("./src/routes/sessions");
const attendanceRoutes = require("./src/routes/attendance");
const pollRoutes = require("./src/routes/polls");
const doubtRoutes = require("./src/routes/doubts");
const feedbackRoutes = require("./src/routes/feedback");
const reportRoutes = require("./src/routes/reports");
const { attachIo, ioEmit } = require("./src/utils/realtime");
const errorHandler = require("./src/middleware/errorHandler");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
  }
});

attachIo(io);

io.on("connection", (socket) => {
  const { sessionId } = socket.handshake.query;
  if (sessionId) {
    socket.join(`session:${sessionId}`);
  }
  socket.on("join-session", (sid) => {
    socket.join(`session:${sid}`);
  });
});

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    credentials: true
  })
);
app.use(express.json());

// Health
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/doubts", doubtRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/reports", reportRoutes);

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
  });
}

module.exports = { app, server, ioEmit };

