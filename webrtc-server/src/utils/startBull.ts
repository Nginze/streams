import { Queue, Worker } from "bullmq";
import { logger } from "../config/logger";
import { HandlerMap } from "./startRabbit";
import { SendParams } from "../types/Misc";
import 'dotenv/config'

const connection = {
  host: process.env.QUEUE_HOST as string,
  port: process.env.QUEUE_PORT as unknown as number,
  password: process.env.QUEUE_PASSWORD as string,
};

export const sendQueue = new Queue("sendqueue", {
  connection,
});

export const startBull = (handler: HandlerMap) => {
  console.log("worker created")
  new Worker(
    "recvqueue",
    async job => {
      try {

        const { op, d } = job.data;

        logger.info(op);
        handler[op as keyof HandlerMap](d, send);
      } catch (err) {
        throw err;
      }
    },
    {
      connection,
    }
  );
};

const send = (params: SendParams) => {
  sendQueue.add("rtc_event", params);
};
