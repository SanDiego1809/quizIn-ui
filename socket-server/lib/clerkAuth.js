const { verifyToken } = require("@clerk/backend");

function isClerkConfigured() {
  return Boolean(process.env.CLERK_SECRET_KEY);
}

async function resolveClerkUserId(token) {
  if (!token || !isClerkConfigured()) return null;
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    return payload?.sub || null;
  } catch {
    return null;
  }
}

function registerClerkAuth(io) {
  io.use(async (socket, next) => {
    const token = socket.handshake?.auth?.token;
    socket.data.userId = await resolveClerkUserId(token);
    next();
  });
}

module.exports = {
  isClerkConfigured,
  resolveClerkUserId,
  registerClerkAuth,
};
