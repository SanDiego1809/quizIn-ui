/** @type {import('next').NextConfig} */
const socketBackend =
  process.env.QUIZIN_SOCKET_URL || "http://127.0.0.1:4000";

const socketBackendBase = socketBackend.replace(/\/$/, "");

const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/socket.io",
          destination: `${socketBackendBase}/socket.io/`,
        },
        {
          source: "/socket.io/:path*",
          destination: `${socketBackendBase}/socket.io/:path*`,
        },
      ],
    };
  },
};

module.exports = nextConfig;
