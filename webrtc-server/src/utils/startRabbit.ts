import amqplib, { Connection, Channel, ConsumeMessage } from "amqplib";
import process from "process";
import "dotenv/config";
import { RecvDTO, SendParams } from "../types/Misc";
import { logger } from "../config/logger";

type OperationHandler = (
  data: RecvDTO,
  send: (data: SendParams) => void
) => Promise<void>;

export type HandlerMap = Record<string, OperationHandler>;

const cleanup = async (channel: any, conn: any) => {
  const sendQueue = "sendqueue";
  const recvQueue = "recvqueue";

  await channel.deleteQueue(recvQueue);
  await channel.deleteQueue(sendQueue);

  await channel.close();
  await conn.close();

  logger.log({ level: "info", message: " cleaning up channel ..." });

  process.exit(0);
};

export const startRabbit = async (handler: HandlerMap) => {
  const sendQueue = "sendqueue";
  const recvQueue = "recvqueue";

  logger.log({
    level: "info",
    message: `connecting to,
    ${process.env.RABBITMQ_URL || "amqp://localhost"}
  `,
  });

  let conn: any = null;
  try {
    conn = await amqplib.connect(
      process.env.RABBITMQ_URL || "amqp://localhost"
    );
  } catch (err) {
    setTimeout(async () => await startRabbit(handler), 2000);
    throw err;
    return;
  }

  logger.log({ level: "info", message: "rabbitmq connected" });

  const channel: any = await conn.createChannel();
  await Promise.all([
    channel.assertQueue(recvQueue),
    channel.assertQueue(sendQueue),
  ]);

  const send = (params: SendParams) => {
    channel.sendToQueue(sendQueue, Buffer.from(JSON.stringify(params)));
  };

  try {
    await channel.consume(
      recvQueue,
      async (e: ConsumeMessage | null) => {
        if (e) {
          const m = e.content.toString();
          const { op, d } = JSON.parse(m);
          logger.log({ level: "critical", message: `${op}` });
          handler[op as keyof HandlerMap](d, send);
        }
      },
      { noAck: true }
    );
  } catch (err) {
    throw err;
  }

  process.on("SIGINT", async () => {
    await cleanup(channel, conn as Connection);
  });
};
