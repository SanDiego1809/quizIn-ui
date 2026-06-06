const { touchSocketActivity } = require("../lib/utils");
const { removeSocketFromAllRooms } = require("../lib/roomLifecycle");
const { registerRoomHandlers } = require("./roomHandlers");
const { registerGameHandlers } = require("./gameHandlers");

function registerSocketHandlers(io, ctx) {
  io.on("connection", (socket) => {
    socket.data = socket.data || {};
    touchSocketActivity(socket);
    socket.onAny(() => touchSocketActivity(socket));

    registerRoomHandlers(socket, ctx);
    registerGameHandlers(socket, ctx);

    socket.on("disconnect", () => {
      removeSocketFromAllRooms(socket, { ...ctx, leaveSocketRooms: false });
    });
  });
}

module.exports = { registerSocketHandlers };
