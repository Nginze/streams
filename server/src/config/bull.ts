import { Queue } from "bullmq";

export const connection = {
  host: process.env.QUEUE_HOST as string,
  port: process.env.QUEUE_PORT as unknown as number,
  password: process.env.QUEUE_PASSWORD as string,
};

export const sendQueue = new Queue("recvqueue", {
  connection,
});

export const wsQueue = new Queue("sendqueue", { connection });

