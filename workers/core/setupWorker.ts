import { Queue, Worker } from "bullmq";
import { cleanUp, getRoomParticipants } from "../helpers/cleanUp";
import { getPeerId } from "../helpers/redisUtils";
import { deleteRoom } from "../helpers/deleteRoom";
import { processMessage } from "../helpers/processMessage";
import "dotenv/config";
import { logger } from "../config/logger";
import { api } from "../config/api";

export const connection = {
  host: process.env.QUEUE_HOST as string,
  port: process.env.QUEUE_PORT as unknown as number,
  password: process.env.QUEUE_PASSWORD as string,
};

export const sendQueue = new Queue("recvqueue", {
  connection,
});

export const setupWsWorker = () => {
  const wsWorker = new Worker(
    "sendqueue",
    async job => {
      const { userId, roomId } = job.data;
      try {
        if (job.name == "clean_up") {
          console.log("new ws job", job.data);

          await cleanUp(userId, roomId);

          const peerId = await getPeerId(userId!);

          await api.post("/api/worker/invalidate", {
            peerId,
          });

          const participants = await getRoomParticipants(roomId);

          if (participants.length < 1) {
            sendQueue.add("destroy_room", {
              op: "destroy-room",
              d: { roomId },
            });
            await deleteRoom(roomId);
          }
        } else {

          const event = job.data;

          await api.post("/api/worker/process", {
            event,
          });
        }
      } catch (error) {
        logger.error(error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 5,
    }
  );

  wsWorker.on("completed", job => {
    logger.info(`${job.name} task done processing`);
  });

  wsWorker.on("ready", () => {
    logger.info(`Worker ready`);
  });

  wsWorker.on("stalled", () => {
    logger.info(`Worker stalled`);
  });
};
