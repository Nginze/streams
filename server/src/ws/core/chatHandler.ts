import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

const init = (
  
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: Socket
) => {
  socket.on("chat:global_new_message", ({ roomId, message }) => {
    io.to(roomId).emit("new-chat-message", { roomId, message });
  });
};

export { init };
