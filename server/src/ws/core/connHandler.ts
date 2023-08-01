import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { logger } from "../../config/logger";
import { UserDTO } from "../../types/User";
import { setUserOffline } from "../helpers/redisUtils";
import { sendQueue } from "../../config/bull";

const init = (
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: Socket
) => {
  socket.on("disconnecting", async () => {
    try {
      //@ts-ignore
      const user: UserDTO = socket.request?.user;
      const currentRoom = Array.from(socket.rooms)[1];

      setUserOffline(user.userId, socket.id);

      if (!currentRoom) {
        return;
      }

      socket.leave(currentRoom);

      sendQueue.add("close_peer", {
        op: "close-peer",
        d: { peerId: socket.id, roomId: currentRoom, userId: user.userId },
      });

      currentRoom
        ? logger.info(`Disconnecting socket is in room, ${currentRoom}`)
        : logger.info(`Disconnection socket wasn't in a room`);
    } catch (error) {
      throw error;
    }
  });

  socket.on("disconnect", () => {
    try {
      logger.info(`Peer disconnected, (${socket.id}) `);
    } catch (error) {
      throw error;
    }
  });
};

export { init };
