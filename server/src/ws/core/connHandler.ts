import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { logger } from "../../config/logger";
import { UserDTO } from "../../types/User";
import { setUserOffline } from "../helpers/redisUtils";
import { sendQueue, wsQueue } from "../../config/bull";
import { cleanUp, getRoomParticipants } from "../helpers/cleanUp";

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

      wsQueue.add("clean_up", {
        userId: user.userId,
        roomId: currentRoom ?? '',
        // io
      });

      if (!currentRoom) {
        logger.info(`Disconnection socket wasn't in a room`);
        return;
      }

      socket.leave(currentRoom);

      sendQueue.add("close_peer", {
        op: "close-peer",
        d: { peerId: socket.id, roomId: currentRoom, userId: user.userId },
      });

      logger.info(`Disconnecting socket is in room, ${currentRoom}`);
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
