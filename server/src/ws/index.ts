import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import * as connHandler from "./core/connHandler";
import * as chatHandler from "./core/chatHandler";
import * as rtcHandler from "./core/rtcHandler";
import * as roomHandler from "./core/roomHandler";
import { logger } from "../config/logger";
import { setUserOnline } from "./helpers/redisUtils";
import { UserDTO } from "../types/User";
import { wsAuthMiddleware } from "./middleware/wsAuth";

export const setupWs = (
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {
  try {
    io.use(wsAuthMiddleware);
    io.on("connection", async (socket: Socket) => {
      logger.info(`Peer (${socket.id}) connected to socket server`);

      //@ts-ignore
      const user: UserDTO = socket.request?.user;
      setUserOnline(user.userId, socket.id);

      connHandler.init(io, socket);
      roomHandler.init(io, socket);
      chatHandler.init(io, socket);
      rtcHandler.init(io, socket);
    });
  } catch (error) {
    logger.error(error);
    throw error;
  }
};
