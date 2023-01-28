import http from "http";
import { Router } from "mediasoup/node/lib/Router";
import { Worker } from "mediasoup/node/lib/Worker";
import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { client } from "../../config/psql";
import { Rooms } from "./types/RoomState";
import { closePeer } from "./utils/closePeer";
import { createConsumer } from "./utils/createConsumer";
import { createTransport, transportToOptions } from "./utils/createTransport";
import { deleteRoom } from "./utils/deleteRoom";
import { startMediasoup } from "./utils/startMediasoup";

export async function main(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) {
  let workers: Array<{ worker: Worker; router: Router }> = [];
  const rooms: Rooms = {};
  let workerIdx = 0;

  try {
    workers = await startMediasoup();
  } catch (err) {
    console.log(err);
    throw err;
  }

  const getNextWorker = () => {
    const w = workers[workerIdx];
    workerIdx++;
    workerIdx %= workers.length;
    return w;
  };

  const createRoom = (socket: Socket, roomId: string) => {
    const { router, worker } = getNextWorker();
    return { worker, router, state: {} };
  };

  io.on("connection", (socket: Socket) => {
    /**
     * Life cycle subscriptions
     */
    console.log(`[socket.io]: peer (${socket.id}) connected to socket server`);

    socket.on("disconnect", () => {
      console.log("[socket.io]: peer disconnected: ", socket.id);
    });

    socket.on("disconnecting", async () => {
      
      const { userid } = (socket.request as any).user;
      const roomId = [...socket.rooms].splice(1)[0];

      console.log(roomId, "disconnect");
      try {
        await client.query(
          `update "user" set currentroomid = null where userid = $1`,
          [userid]
        );
        await client.query(`delete from room_permission where userid = $1`, [
          userid,
        ]);
      } catch (err) {
        console.log("couldn't gracefully disconnect user", err);
      }
      socket.broadcast
        .to(roomId)
        .emit("user-left-room", { peerId: userid, roomId });
    });

    socket.on("connect_error", err => {
      console.log("[socket.io]: peer connection error: ", err);
    });

    /**
     * Voice room events
     */

    socket.on("create-room", async () => {
      console.log("created room");
      //Todo: database creation of room **returning roomId**
      const roomId = "72a59400-edb3-4b55-a3eb-3d93d05790b5";
      if (!(roomId in rooms)) {
        rooms[roomId] = createRoom(socket, roomId);
      }
      console.log(rooms);
    });

    socket.on("join-as-speaker", async ({ roomId, peerId, peer }) => {
      socket.join(roomId);
      if (!(roomId in rooms)) {
        rooms[roomId] = createRoom(socket, roomId);
      }

      const { router, state } = rooms[roomId];
      const [recvTransport, sendTransport] = await Promise.all([
        createTransport("recv", router, peerId),
        createTransport("send", router, peerId),
      ]);

      if (state[peerId]) {
        closePeer(state[peerId]);
      }

      rooms[roomId].state[peerId] = {
        recvTransport,
        sendTransport,
        consumers: [],
        producer: null,
      };

      console.log(rooms[roomId]);
      io.to(socket.id).emit("you-joined-as-a-speaker", {
        roomId,
        peerId,
        routerRtpCapabilities: rooms[roomId].router.rtpCapabilities,
        recvTransportOptions: transportToOptions(recvTransport),
        sendTransportOptions: transportToOptions(sendTransport),
      });

      // await client.query
      if (peer.isspeaker !== undefined) {
        socket.broadcast
          .to(roomId)
          .emit("new-user-joined-room", { peer, roomId });
      }
    });

    socket.on("join-as-new-peer", async ({ roomId, peerId }) => {
      socket.join(roomId);
      if (!(roomId in rooms)) {
        rooms[roomId] = createRoom(socket, roomId);
      }

      const { router, state } = rooms[roomId];
      const recvTransport = await createTransport("recv", router, peerId);

      if (state[peerId]) {
        closePeer(state[peerId]);
      }

      rooms[roomId].state[peerId] = {
        recvTransport,
        sendTransport: null,
        consumers: [],
        producer: null,
      };

      console.log(rooms[roomId]);

      io.to(socket.id).emit("you-joined-as-a-peer", {
        roomId,
        peerId,
        routerRtpCapabilities: rooms[roomId].router.rtpCapabilities,
        recvTransportOptions: transportToOptions(recvTransport),
      });
    });

    socket.on("add-speaker", async ({ roomId, peerId }) => {
      if (!rooms[roomId]?.state[peerId]) {
        return;
      }

      const { router } = rooms[roomId];
      const sendTransport = await createTransport("send", router, peerId);
      rooms[roomId].state[peerId].sendTransport?.close();
      rooms[roomId].state[peerId].sendTransport = sendTransport;

      console.log(rooms[roomId]);
    });

    socket.on("remove-speaker", ({ roomId, peerId }) => {
      if (roomId in rooms) {
        const peer = rooms[roomId].state[peerId];
        peer?.producer?.close();
        peer?.sendTransport?.close();
      }

      console.log(rooms[roomId]);
    });

    socket.on("close-peer", async ({ roomId, peerId }) => {
      if (roomId in rooms) {
        if (peerId in rooms[roomId].state) {
          closePeer(rooms[roomId].state[peerId]);
          delete rooms[roomId].state[peerId];
        }
        if (Object.keys(rooms[roomId].state).length === 0) {
          deleteRoom(roomId, rooms);
        }
      }

      if (rooms[roomId]) {
        console.log("new room state: ", rooms[roomId]);
      } else {
        console.log("room deleted: ", rooms);
      }
    });

    socket.on("destroy-room", ({ roomId }) => {
      if (roomId in rooms) {
        for (const peer of Object.values(rooms[roomId].state)) {
          closePeer(peer);
        }
      }
      deleteRoom(roomId, rooms);
      console.log("room destroyed: ", rooms);
    });

    /**
     * Voice rooms setup
     */

    socket.on(
      "connect-transport",
      async ({ roomId, dtlsParameters, peerId, direction }, cb) => {
        if (!rooms[roomId]?.state[peerId]) {
          console.log(roomId);
          console.log(rooms);
          console.log("no roomid or peerid", peerId);
          return;
        }
        console.log("got here");
        const { state } = rooms[roomId];
        const transport =
          direction === "recv"
            ? state[peerId].recvTransport
            : state[peerId].sendTransport;

        if (!transport) {
          console.log("no transport");
          return;
        }

        console.log("connecting... to transport");
        try {
          await transport.connect({ dtlsParameters });
        } catch (err) {
          console.log(err);
        }

        cb();
      }
    );

    socket.on(
      "get-recv-tracks",
      async ({ roomId, peerId, rtpCapabilities }) => {
        const consumerParametersArr = [];

        if (!rooms[roomId]?.state[peerId]?.recvTransport) {
          return;
        }

        const { state, router } = rooms[roomId];
        const transport = state[peerId].recvTransport;
        if (!transport) {
          return;
        }

        for (const theirPeerId of Object.keys(state)) {
          const peerState = state[theirPeerId];
          if (theirPeerId === peerId || !peerState || !peerState.producer) {
            continue;
          }
          try {
            const { producer } = peerState;
            consumerParametersArr.push(
              await createConsumer(
                router,
                producer,
                rtpCapabilities,
                transport,
                peerId,
                state[theirPeerId]
              )
            );
          } catch (err) {
            console.log(err);
            continue;
          }
        }
        io.to(socket.id).emit("get-recv-tracks-done", {
          consumerParametersArr,
          roomId,
        });
      }
    );

    socket.on(
      "send-track",
      async (
        {
          roomId,
          transportId,
          direction,
          peerId,
          kind,
          rtpParameters,
          rtpCapabilities,
          paused,
          appData,
        },
        cb
      ) => {
        if (!(roomId in rooms)) {
          return;
        }
        const { state } = rooms[roomId];
        const {
          sendTransport,
          producer: previousProducer,
          consumers,
        } = state[peerId];
        const transport = sendTransport;
        if (!transport) {
          return;
        }

        try {
          if (previousProducer) {
            previousProducer.close();
            consumers.forEach(c => c.close());
          }
        } catch {}

        const producer = await transport.produce({
          kind,
          rtpParameters,
          paused,
          appData: { ...appData, peerId, transportId },
        });

        rooms[roomId].state[peerId].producer = producer;
        for (const theirPeerId of Object.keys(state)) {
          if (theirPeerId === peerId) {
            continue;
          }
          const peerTransport = state[theirPeerId]?.recvTransport;
          if (!peerTransport) {
            continue;
          }
          try {
            const d = await createConsumer(
              rooms[roomId].router,
              producer,
              rtpCapabilities,
              peerTransport,
              peerId,
              state[theirPeerId]
            );

            socket.broadcast
              .to(roomId)
              .emit("new-peer-speaker", { ...d, roomId });
          } catch (err) {
            console.log(err);
          }
        }

        console.log("producer created", producer.id);

        cb(producer.id);
      }
    );
    /**
     * room state events
     */
    socket.on("user-speaking", ({ userId, roomId }) => {
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
  });
}
