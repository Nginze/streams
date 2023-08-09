import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { channel } from "../config/rabbit";
import { redisClient } from "../config/redis";
import { broadcastExcludeSender } from "./helpers/broadcastExcludeSender";
import { processMessage } from "./helpers/processMessage";
import { wsAuthMiddleware } from "./middleware/wsAuth";
import { UserDTO } from "../types/User";
import { logger } from "../config/logger";
import { apiClient } from "./helpers/restClient";

const recvQueue = "sendqueue";
const sendQueue = "recvqueue";

export async function main(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) {
  io.use(wsAuthMiddleware);

  io.on("connection", async (socket: Socket) => {
    const user: UserDTO = (socket.request as any).user;

    logger.log({
      level: "info",
      message: `peer (${socket.id}) connected to socket server`,
    });

    try {
      await channel.consume(
        recvQueue,
        async msg => {
          if (!msg) {
            logger.log({
              level: "info",
              message: `peer (${socket.id}) connected to socket server`,
            });
            return;
          }
          const e = JSON.parse(msg.content.toString());
          processMessage(e, e.peerId, io);
        },
        { noAck: true }
      );
    } catch (err) {
      throw err;
    }

    redisClient.set(user.userId, socket.id);
    redisClient.sadd("onlineUsers", user.userId);

    //Socket Handlers
    socket.on("disconnecting", async () => {
      logger.log({
        level: "info",
        message: `disconnecting socket is in room, ${
          Array.from(socket.rooms)[1]
        }`,
      });

      const roomId = Array.from(socket.rooms)[1];
      const user: UserDTO = (socket.request as any).user;
      const clients = io.sockets.adapter.rooms.get(roomId);

      redisClient.srem("onlineUsers", user.userId);
      redisClient.del(user.userId);

      if (!roomId) {
        return;
      }

      channel.sendToQueue(
        sendQueue,
        Buffer.from(
          JSON.stringify({
            op: "close-peer",
            d: { peerId: socket.id, roomId, userId: user.userId },
          })
        )
      );

      console.log("leaving room");

      socket.leave(roomId);

      console.log(clients);
      console.log(clients?.size);

      console.log("at performing leave transactions");
      await apiClient.post(
        `/room/leave?roomId=${roomId}&&userId=${user.userId}`
      );

      console.log("at pinging timestamp");
      await apiClient.post(`/profile/ping?userId=${user.userId}`);

      if (!clients) {
        return;
      }

      if (clients!.size < 1) {
        console.log("destroying room on voice server (idempotent)", roomId);
        await apiClient.post(`/room/soft-delete?roomId=${roomId}`);
        channel.sendToQueue(
          sendQueue,
          Buffer.from(
            JSON.stringify({
              op: "destroy-room",
              d: { roomId },
            })
          )
        );
      }
    });

    socket.on("disconnect", () => {
      logger.log({
        level: "info",
        message: `peer disconnected, (${socket.id}) `,
      });
    });

    socket.on("leave-room", async ({ roomId }) => {
      const clients = io.sockets.adapter.rooms.get(roomId);
      const user: UserDTO = (socket.request as any).user;

      channel.sendToQueue(
        sendQueue,
        Buffer.from(
          JSON.stringify({
            op: "close-peer",
            d: { peerId: socket.id, roomId, userId: user.userId },
          })
        )
      );

      if (!clients) {
        return;
      }

      console.log("leaving room");
      socket.leave(roomId);

      console.log(clients.size);

      if (clients.size < 1) {
        console.log("destroying room", roomId);
        await apiClient.post(`/room/destroy?roomId=${roomId}`);
        channel.sendToQueue(
          sendQueue,
          Buffer.from(
            JSON.stringify({
              op: "destroy-room",
              d: { roomId },
            })
          )
        );
      }
    });

    socket.on("create-room", async ({ roomId }) => {
      channel.sendToQueue(
        sendQueue,
        Buffer.from(
          JSON.stringify({
            op: "create-room",
            d: { roomId, peerId: socket.id },
          })
        )
      );
    });

    socket.on(
      "join-room",
      async ({ roomId, roomMeta: { isAutospeaker, isCreator } }) => {
        const user = (socket.request as any).user;
        await redisClient.set(user.userid, socket.id);
        socket.join(roomId);
        console.log(roomId, isAutospeaker, isCreator);
        channel.sendToQueue(
          sendQueue,
          Buffer.from(
            JSON.stringify({
              op:
                isAutospeaker || isCreator
                  ? "join-as-speaker"
                  : "join-as-new-peer",
              d: { peerId: socket.id, roomId },
            })
          )
        );
        const event = {
          op: "new-user-joined-room",
          peerId: socket.id,
          d: {
            roomId,
            user: {
              ...user,
              isspeaker: isAutospeaker || isCreator,
            },
          },
        };
        broadcastExcludeSender(io, event);
      }
    );

    socket.on("connect-transport", async (d, cb) => {
      const user: UserDTO = (socket.request as any).user;
      channel?.sendToQueue(
        sendQueue,
        Buffer.from(
          JSON.stringify({
            op: "connect-transport",
            d: { ...d, peerId: socket.id },
          })
        )
      );
      cb();
    });

    socket.on("send-track", async (d, cb) => {
      const user: UserDTO = (socket.request as any).user;
      channel?.sendToQueue(
        sendQueue,
        Buffer.from(
          JSON.stringify({ op: "send-track", d: { ...d, peerId: socket.id } })
        )
      );
    });

    socket.on("get-recv-tracks", async ({ roomId, rtpCapabilities }) => {
      const user: UserDTO = (socket.request as any).user;
      console.log("getting audio tracks of room members");
      const { userId } = user;
      channel?.sendToQueue(
        sendQueue,
        Buffer.from(
          JSON.stringify({
            op: "get-recv-tracks",
            d: { roomId, peerId: socket.id, rtpCapabilities },
          })
        )
      );
    });

    socket.on("add-speaker", async ({ roomId, userId }) => {
      const peerId = await redisClient.get(userId);
      console.log("attempting to add speaker , peerId: ", peerId);
      channel?.sendToQueue(
        sendQueue,
        Buffer.from(
          JSON.stringify({
            op: "add-speaker",
            d: { roomId, peerId },
          })
        )
      );
      io.to(roomId).emit("speaker-added", { roomId, userId });
      io.to(peerId as string).emit("add-speaker-permissions", {
        roomId,
        userId,
      });
    });

    socket.on("remove-speaker", async ({ roomId, userId }) => {
      const peerId = await redisClient.get(userId);
      channel?.sendToQueue(
        sendQueue,
        Buffer.from(
          JSON.stringify({
            op: "remove-speaker",
            d: { roomId, peerId },
          })
        )
      );
      io.to(roomId).emit("speaker-removed", { roomId, userId });
      io.to(peerId as string).emit("remove-speaker-permissions", {
        roomId,
        userId,
      });
    });

    socket.on("user-started-speaking", ({ userId, roomId }) => {
      io.to(roomId).emit("active-speaker-change", {
        userId,
        roomId,
        status: "speaking",
      });
    });

    socket.on("user-stopped-speaking", ({ userId, roomId }) => {
      io.to(roomId).emit("active-speaker-change", {
        userId,
        roomId,
        status: "stopped",
      });
    });

    socket.on("user-asked-to-speak", ({ userId, roomId }) => {
      io.to(roomId).emit("hand-raised", { userId, roomId });
    });

    socket.on("user-muted-mic", ({ userId, roomId }) => {
      io.to(roomId).emit("mute-changed", { userId, roomId });
    });

    socket.on("new-chat-message", ({ roomId, message }) => {
      io.to(roomId).emit("new-chat-message", { roomId, message });
    });

    socket.on("invalidate-participants", ({ roomId }) => {
      io.to(roomId).emit("invalidate-participants", { roomId });
    });

    socket.on("mod-added", async ({ userId, roomId }) => {
      const peerId = await redisClient.get(userId);
      console.log("new mod is, ", peerId);
      io.to(roomId).emit("mod-added", { userId, roomId });
      io.to(peerId as string).emit("you-are-now-a-mod", {
        roomId,
      });
    });

    socket.on("mod-removed", async ({ userId, roomId }) => {
      const peerId = await redisClient.get(userId);
      console.log("demoted mod is, ", peerId);
      io.to(roomId).emit("mod-removed", { userId, roomId });
      io.to(peerId as string).emit("you-are-no-longer-a-mod", {
        roomId,
      });
    });

    socket.on("toggle-room-chat", async ({ roomId }) => {
      console.log("toggled chat");
      io.to(roomId).emit("toggle-room-chat", { roomId });
    });

    socket.on("toggle-hand-raise-enabled", async ({ roomId }) => {
      console.log("toggled hand raise", roomId);

      io.to(roomId).emit("toggle-hand-raise-enabled", { roomId });
    });

    socket.on("leave-room-all", async ({ roomId, hostId }) => {
      io.to(roomId).emit("leave-room-all", { roomId, hostId });
    });

    socket.on("room-invite", async ({ room, user, to }) => {
      const peerId = await redisClient.get(to);
      io.to(peerId as string).emit("room-invite", {
        room,
        user,
      });
    });

    socket.on("room-name-changed", async ({ roomId, value }) => {
      io.to(roomId).emit("room-name-changed", { roomId, value });
    });

    socket.on(
      "ban-list-change",
      async ({ roomId, banType, bannedUser, isBan }) => {
        io.to(roomId).emit("ban-list-change", {
          roomId,
          banType,
          bannedUser,
          isBan,
        });
      }
    );

    socket.on("kicked-from-room", async ({ userId, roomId }) => {
      const peerId = await redisClient.get(userId);
      io.to(peerId as string).emit("kicked-from-room", { userId, roomId });
    });
  });
}
