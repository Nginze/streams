import { Queue, Worker } from "bullmq";
import { Server } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { processMessage } from "../ws/helpers/processMessage";
import { logger } from "./logger";
import "dotenv/config";
import { cleanUp, getRoomParticipants } from "../ws/helpers/cleanUp";
import { getPeerId } from "../ws/helpers/redisUtils";
import { deleteRoom } from "../ws/helpers/deleteRoom";

export const connection = {
  host: process.env.QUEUE_HOST as string,
  port: process.env.QUEUE_PORT as unknown as number,
  password: process.env.QUEUE_PASSWORD as string,
};

export const sendQueue = new Queue("recvqueue", {
  connection,
});

export const wsQueue = new Queue("sendqueue", { connection });

export const setupWsWorker = (
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {
  const wsWorker = new Worker(
    "sendqueue",
    async job => {
      if (job.name == "clean_up") {
        console.log("new ws job", job.data);
        try {
          const { userId, roomId } = job.data;

          await cleanUp(userId, roomId);

          const peerId = await getPeerId(userId!);

          io.to(peerId as string).emit("invalidate-feed", {});
          const participants = await getRoomParticipants(roomId);

          if (participants.length < 1) {
            sendQueue.add("destroy_room", {
              op: "destroy-room",
              d: { roomId },
            });
            await deleteRoom(roomId)
          }
        } catch (error) {
          throw error;
        }
      } else {
        try {
          const event = job.data;
          processMessage(event, event.peerId, io);
        } catch (error) {
          throw error;
        }
      }
    },
    {
      connection,
      concurrency: 5,
      sharedConnection: true,
    }
  );

  wsWorker.on("completed", job => {
    logger.info(`${job.name} task done processing`);
  });
};

// export const setupCleanupWorker = (
//   io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
// ) => {
//   new Worker("wsqueue", async job => {}, {
//     connection,
//     concurrency: 5,
//     sharedConnection: true,
//   });
// };

// export const setUpThreadWorker = () => {
//   const processorFile = path.join(
//     "/home/jonathan/projects/drop/server/src/jobs",
//     "index.ts"
//   );
//   const worker = new Worker("cleanupqueue", processorFile, { connection });
// };
