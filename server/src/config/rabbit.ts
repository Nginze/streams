import amqplib, { Channel, Connection } from "amqplib";
import * as dotenv from "dotenv";
dotenv.config();

const recvQueue = "sendqueue";
const sendQueue = "recvqueue";
const onlineQueue = "onlinequeue";

let channel: Channel;
(async () => {
  console.log(
    "trying to connect to",
    process.env.RABBITMQ_URL || "amqp://localhost"
  );
  let conn: Connection | null = null;
  try {
    conn = await amqplib.connect(
      process.env.RABBITMQ_URL || "amqp://localhost"
    );
  } catch (err) {
    console.log("[rabbitmq]: unable to connect to rabbit");
    return;
  }
  console.log("[rabbitmq]: connected to rabbit");
  channel = await conn.createChannel();
  await Promise.all([
    channel.assertQueue(recvQueue),
    channel.assertQueue(sendQueue),
    channel.assertQueue(onlineQueue),
  ]);

  await channel.purgeQueue(recvQueue);
})();

export { channel };
