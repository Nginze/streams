import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { channel } from "../../config/rabbit";
import { redisClient } from "../../config/redis";
import { broadcastExcludeSender } from "../../config/utils/broadcastExcludeSender";
import { processMessage } from "../../config/utils/processMessage";

const recvQueue = "sendqueue";
const sendQueue = "recvqueue";

export async function main(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) {
  io.on("connection", async (socket: Socket) => {
    channel.consume(
      recvQueue,
      async msg => {
        if (!msg) {
          console.log("no message returned from queue");
          return;
        }
        const event = JSON.parse(msg.content.toString());
        processMessage(event, event.peerId, io);
      },
      { noAck: false }
    );
    console.log(`[socket.io]: peer (${socket.id}) connected to socket server`);
    const user = (socket.request as any).user;
    redisClient.set(user?.userId, socket.id);

    socket.on("disconnecting", () => {
      console.log(
        "[socket.io]: disconnecting socket is in room,",
        Array.from(socket.rooms)[1]
      );
      const roomId = Array.from(socket.rooms)[1];
      const user = (socket.request as any).user;
      const clients = io.sockets.adapter.rooms.get(roomId);

      channel.sendToQueue(
        sendQueue,
        Buffer.from(
          JSON.stringify({
            op: "close-peer",
            d: { peerId: socket.id, roomId, userId: user?.userid },
          })
        )
      );

      if (!clients) {
        return;
      }
      if (clients.size <= 1) {
        console.log("destroying room", roomId);
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
      redisClient.del(user.userid)
    });

    socket.on("disconnect", () => {
      console.log("[socket.io]: peer disconnected: ", socket.id);
    });

    socket.on("leave-room", ({ roomId }) => {
      console.log("attempting to leave room");
      const clients = io.sockets.adapter.rooms.get(roomId);
      const user = (socket.request as any).user;

      channel.sendToQueue(
        sendQueue,
        Buffer.from(
          JSON.stringify({
            op: "close-peer",
            d: { peerId: socket.id, roomId, userId: user?.userid },
          })
        )
      );

      if (!clients) {
        return;
      }
      if (clients.size <= 1) {
        console.log("destroying room", roomId);
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
      console.log("new room id is:", roomId);
      const user = (socket.request as any).user;
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
      const user = (socket.request as any).user;
      if (user) {
        const { userid } = user;
        channel?.sendToQueue(
          sendQueue,
          Buffer.from(
            JSON.stringify({
              op: "connect-transport",
              d: { ...d, peerId: socket.id },
            })
          )
        );
      }
      cb();
    });

    socket.on("send-track", async (d, cb) => {
      const user = (socket.request as any).user;
      if (user) {
        const { userid } = user;
        channel?.sendToQueue(
          sendQueue,
          Buffer.from(
            JSON.stringify({ op: "send-track", d: { ...d, peerId: socket.id } })
          )
        );
      }
    });

    socket.on(
      "get-recv-tracks",
      async ({ roomId, peerId, rtpCapabilities }) => {
        const user = (socket.request as any).user;
        console.log("getting audio tracks of room members");
        if (user) {
          const { userid } = user;
          channel?.sendToQueue(
            sendQueue,
            Buffer.from(
              JSON.stringify({
                op: "get-recv-tracks",
                d: { roomId, peerId: socket.id, rtpCapabilities },
              })
            )
          );
        }
      }
    );

    socket.on("add-speaker", async ({ roomId, userId }) => {
      const peerSocketId = await redisClient.get(userId) 
      console.log("attempting to add speaker , userid: ", peerSocketId);
      channel?.sendToQueue(
        sendQueue,
        Buffer.from(
          JSON.stringify({
            op: "add-speaker",
            d: { roomId, peerId: peerSocketId },
          })
        )
      );
      io.to(roomId).emit("speaker-added", { roomId, userId});
    });

    socket.on("remove-speaker", async ({ roomId, userId }) => {
      const peerSocketId = await redisClient.get(userId) 
      channel?.sendToQueue(
        sendQueue,
        Buffer.from(
          JSON.stringify({
            op: "remove-speaker",
            d: { roomId, peerId: peerSocketId },
          })
        )
      );
      io.to(roomId).emit("speaker-removed", { roomId, userId });
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
  });
}
