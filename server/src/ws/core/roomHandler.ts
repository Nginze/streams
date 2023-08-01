import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { getPeerId } from "../helpers/redisUtils";
import { logger } from "../../config/logger";

type SocketDTO = {
  roomId: string;
  userId?: string;
};

const init = (
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: Socket
) => {
  /**
   * voice presence events
   */
  socket.on("presence:speaking", ({ userId, roomId }: SocketDTO) => {
    try {
      if (!userId || !roomId) {
        throw new Error("Bad request from client");
      }
      io.to(roomId).emit("active-speaker-change", {
        userId,
        roomId,
        status: "speaking",
      });
    } catch (error) {
      throw error;
    }
  });

  socket.on("presence:not_speaking", ({ userId, roomId }: SocketDTO) => {
    try {
      if (!userId || !roomId) {
        throw new Error("Bad request from client");
      }
      io.to(roomId).emit("active-speaker-change", {
        userId,
        roomId,
        status: "stopped",
      });
    } catch (error) {
      throw error;
    }
  });

  /**
   * peer action events
   */
  socket.on("action:hand_raise", ({ userId, roomId }: SocketDTO) => {
    try {
      io.to(roomId).emit("hand-raised", { userId, roomId });
    } catch (error) {
      throw error;
    }
  });

  socket.on("action:hand_down", ({ userId, roomId }: SocketDTO) => {
    try {
      io.to(roomId).emit("hand-down", { userId, roomId });
    } catch (error) {
      throw error;
    }
  });

  socket.on("action:mute", ({ userId, roomId }: SocketDTO) => {
    try {
      io.to(roomId).emit("mute-changed", { userId, roomId });
    } catch (error) {
      throw error;
    }
  });

  socket.on("action:unmute", ({ userId, roomId }: SocketDTO) => {
    try {
      io.to(roomId).emit("mute-changed", { userId, roomId });
    } catch (error) {
      throw error;
    }
  });

  socket.on("action:invite", ({ userId, roomId }: SocketDTO) => {
    // const peerId = await redisClient.get(to);
    // io.to(peerId as string).emit("room-invite", {
    //   room,
    //   user,
    // });
  });

  /**
   * moderation events (Can only be performed by creators & mods)
   */
  socket.on("mod:promote", async ({ userId, roomId }: SocketDTO) => {
    try {
      const peerId = await getPeerId(userId!);
      io.to(roomId).emit("mod-added", { userId, roomId });
      io.to(peerId as string).emit("you-are-now-a-mod", {
        roomId,
      });
    } catch (error) {
      throw error;
    }
  });

  socket.on("mod:demote", async ({ userId, roomId }: SocketDTO) => {
    try {
      const peerId = await getPeerId(userId!);
      io.to(roomId).emit("mod-removed", { userId, roomId });
      io.to(peerId as string).emit("you-are-no-longer-a-mod", {
        roomId,
      });
    } catch (error) {
      throw error;
    }
  });

  socket.on("mod:enable_chat", ({ roomId }: SocketDTO) => {
    try {
      io.to(roomId).emit("toggle-room-chat", { roomId });
    } catch (error) {
      throw error;
    }
  });

  socket.on("mod:disable_chat", ({ roomId }: SocketDTO) => {
    try {
      io.to(roomId).emit("toggle-room-chat", { roomId });
    } catch (error) {
      throw error;
    }
  });

  socket.on("mod:enable_hand", ({ roomId }: SocketDTO) => {
    try {
      io.to(roomId).emit("toggle-hand-raise-enabled", { roomId });
    } catch (error) {
      throw error;
    }
  });

  socket.on("mod:disable_hand", ({ roomId }: SocketDTO) => {
    try {
      io.to(roomId).emit("toggle-hand-raise-enabled", { roomId });
    } catch (error) {
      throw error;
    }
  });

  socket.on("mod:change_room_name", async ({roomId, newRoomName}) => {
    io.to(roomId).emit("room-name-changed", { roomId, newRoomName});
  });

  // socket.on("moderation:leave_room_all", async () => {});

  // socket.on("ban-list-change", async () => {});

  // socket.on("kicked-from-room", async () => {});

  // async cleanup events
};

export { init };
