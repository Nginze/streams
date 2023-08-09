import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { getPeerId } from "../helpers/redisUtils";
import { logger } from "../../config/logger";
import { cleanUp, getRoomParticipants } from "../helpers/cleanUp";
import { sendQueue, wsQueue } from "../../config/bull";
import { broadcastExcludeSender } from "../helpers/broadcastExcludeSender";

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

  socket.on("action:invite", async ({ user, room, to }) => {
    const peerId = await getPeerId(to);
    io.to(peerId as string).emit("room-invite", {
      room,
      user,
    });
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

  socket.on("mod:change_room_name", async ({ roomId, newRoomName }) => {
    io.to(roomId).emit("room-name-changed", { roomId, newRoomName });
  });

  socket.on("action:leave_room", async ({ roomId, byHost }) => {
    try {
      //@ts-ignore
      const user: UserDTO = socket.request?.user;
      const currentRoom = Array.from(socket.rooms)[1];

      if (!currentRoom) {
        return;
      }

      wsQueue.add("clean_up", {
        userId: user.userId,
        roomId: currentRoom ?? "",
      });

      socket.leave(currentRoom);

      sendQueue.add("close_peer", {
        op: "close-peer",
        d: { peerId: socket.id, roomId: currentRoom, userId: user.userId },
      });

      const peerId = await getPeerId(user.userId!);

      io.to(peerId as string).emit("leave-room", {
        roomId,
        byHost,
      });

      logger.info(`${socket.id} left room ${currentRoom}`);
    } catch (error) {
      throw error;
    }
  });

  socket.on("mod:leave_room_all", async ({ roomId, hostId }) => {
    io.to(roomId).emit("leave-room-all", { roomId, hostId });
  });

  socket.on(
    "mod:ban_list_change",
    async ({ roomId, banType, bannedUser, isBan }) => {
      io.to(roomId).emit("ban-list-change", {
        roomId,
        banType,
        bannedUser,
        isBan,
      });
    }
  );

  socket.on("mod:kicked_from_room", async ({ userId, roomId }) => {
    const peerId = await getPeerId(userId);
    io.to(peerId as string).emit("kicked-from-room", { userId, roomId });
    broadcastExcludeSender(io, {
      op: "user-left-room",
      peerId,
      d: {
        userId,
        roomId,
      },
    });
  });
};

export { init };
