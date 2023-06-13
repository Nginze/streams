import amqplib, { Channel, Connection } from "amqplib";
import "dotenv/config";
import { logger } from "./logger";

const recvQueue = "sendqueue";
const sendQueue = "recvqueue";

const cleanup = async (channel: Channel, conn: Connection) => {
  const sendQueue = "sendqueue";
  const recvQueue = "recvqueue";

  await channel.close();
  await conn.close();

  logger.log({ level: "info", message: "cleaning up channel ..." });

  process.exit(0);
};

let channel: Channel;

try {
  (async () => {
    logger.log({
      level: "info",
      message: `connecting to, ${
        process.env.RABBITMQ_URL || "amqp://localhost"
      }`,
    });

    let conn: Connection | null = null;

    try {
      conn = await amqplib.connect(
        process.env.RABBITMQ_URL || "amqp://localhost"
      );
    } catch (err) {
      logger.log({
        level: "error",
        message: "unable to connect to rabbitmq",
      });
      return;
    }

    logger.log({ level: "info", message: "connected to rabbitmq" });

    channel = await conn.createChannel();

    await Promise.all([
      channel.assertQueue(recvQueue),
      channel.assertQueue(sendQueue),
    ]);
  })();
} catch (err) {
  logger.log({ level: "error", message: `${err}` });
}

export { channel };
