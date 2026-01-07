let ioInstance = null;

function attachIo(io) {
  ioInstance = io;
}

function ioEmit(sessionId, event, payload) {
  if (!ioInstance) return;
  ioInstance.to(`session:${sessionId}`).emit(event, payload);
}

module.exports = { attachIo, ioEmit };

