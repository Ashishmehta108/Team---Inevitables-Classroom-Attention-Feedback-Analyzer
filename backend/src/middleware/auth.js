const jwt = require("jsonwebtoken");

function auth(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      if (!required) return next();
      return res.status(401).json({ error: "Missing token" });
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
      req.user = {
        id: payload.sub,
        role: payload.role,
        anonymousCode: payload.anonymousCode || null
      };
      return next();
    } catch (e) {
      if (!required) return next();
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  };
}

module.exports = auth;

