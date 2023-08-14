import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { sendQueue } from "../../config/bull";
import { broadcastExcludeSender } from "../helpers/broadcastExcludeSender";
import { getPeerId, getUser } from "../helpers/redisUtils";

const init = (
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: Socket
) => {
  socket.on("rtc:create_room", ({ roomId }) => {
    console.log("create room");
    try {
      sendQueue.add("create_room", {
        op: "create-room",
        d: { roomId, peerId: socket.id },
      });
    } catch (error) {
      throw error;
    }
  });

  socket.on(
    "rtc:join_room",
    ({ roomId, roomMeta: { isAutospeaker, isCreator } }) => {
      console.log("join room");
      try {
        const user = getUser(socket);
        socket.join(roomId);

        sendQueue.add("join_room", {
          op:
            isAutospeaker || isCreator ? "join-as-speaker" : "join-as-new-peer",
          d: { peerId: socket.id, roomId },
        });

        const joinEvent = {
          op: "new-user-joined-room",
          peerId: socket.id,
          d: {
            roomId,
            user: {
              ...user,
              isSpeaker: isAutospeaker || isCreator,
              isMuted: true,
              raisedHand: false,
              isMod: isCreator
            },
          },
        };

        broadcastExcludeSender(io, joinEvent);
      } catch (error) {
        throw error;
      }
    }
  );

  socket.on("rtc:connect_transport", (d, cb) => {

    console.log("connect_transport")
    try {
      sendQueue.add("connect_transport", {
        op: "connect-transport",
        d: { ...d, peerId: socket.id },
      });
      cb();
    } catch (error) {
      throw error;
    }
  });

  socket.on("rtc:send_track", d => {
    console.log("send_track")
    try {
      sendQueue.add("send_track", {
        op: "send-track",
        d: { ...d, peerId: socket.id },
      });
    } catch (error) {
      throw error;
    }
  });

  socket.on("rtc:get_recv_tracks", async ({ roomId, rtpCapabilities }) => {
    console.log("get_recv_tracks")
    try {
      sendQueue.add("get_recv-tracks", {
        op: "get-recv-tracks",
        d: { roomId, peerId: socket.id, rtpCapabilities },
      });
    } catch (error) {
      throw error;
    }
  });

  socket.on("rtc:add_speaker", async ({ roomId, userId }) => {
    console.log("adding speaker")
    try {
      const peerId = (await getPeerId(userId)) as string;

      // connect users voice to voice server
      sendQueue.add("add_speaker", {
        op: "add-speaker",
        d: { roomId, peerId },
      });

      // notify all room members and receiving peer about room state change
      io.to(roomId).emit("speaker-added", { roomId, userId });
      io.to(peerId).emit("add-speaker-permissions", {
        roomId,
        userId,
      });
    } catch (error) {
      throw error;
    }
  });

  socket.on("rtc:remove_speaker", async ({ roomId, userId }) => {
    console.log("removing speaker")
    try {
      const peerId = (await getPeerId(userId)) as string;

      // disconnect users voice from voice server
      sendQueue.add("remove_speaker", {
        op: "remove-speaker",
        d: { roomId, peerId },
      });

      // notify all room members and receiving peer about room state change
      io.to(roomId).emit("speaker-removed", { roomId, userId });
      io.to(peerId as string).emit("remove-speaker-permissions", {
        roomId,
        userId,
      });
    } catch (error) {
      throw error;
    }
  });
};

export { init };
