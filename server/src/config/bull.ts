import { Queue, Worker } from "bullmq";
import { Server } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { processMessage } from "../ws/helpers/processMessage";
import { logger } from "./logger";
import "dotenv/config";

const connection = {
  host: process.env.QUEUE_HOST as string,
  port: process.env.QUEUE_PORT as unknown as number,
  password: process.env.QUEUE_PASSWORD as string,
};

export const sendQueue = new Queue("recvqueue", {
  connection,
});

export const setupWsWorker = (
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {
  new Worker(
    "sendqueue",
    async job => {
      try {
        const event = job.data;
        processMessage(event, event.peerId, io);
      } catch (error) {
        logger.error(error);
        throw error;
      }
    },
    {
      connection,
    }
  );
};
