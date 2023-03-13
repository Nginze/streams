import amqplib, { Connection } from "amqplib";
import {
  RtpCapabilities,
  DtlsParameters,
  RtpParameters,
  MediaKind,
} from "mediasoup/node/lib/types";
import "dotenv";

type handlerParams = {
  roomId: string;
  peerId: string;
  transportId: any;
  dtlsParameters: DtlsParameters;
  direction: string;
  rtpCapabilities: RtpCapabilities;
  kind: MediaKind;
  rtpParameters: RtpParameters;
  paused: boolean;
  appData: any;
};
export type handlerMap = {
  "create-room": (
    data: { roomId: string; peerId: string },
    send: (obj: any) => void
  ) => void;
  "join-as-speaker": (
    data: { roomId: string; peerId: string },
    send: (obj: any) => void
  ) => void;
  "join-as-new-peer": (
    data: { roomId: string; peerId: string },
    send: (obj: any) => void
  ) => void;
  "add-speaker": (
    data: { roomId: string; peerId: string },
    send: (obj: any) => void
  ) => void;
  "remove-speaker": (
    data: { roomId: string; peerId: string },
    send: (obj: any) => void
  ) => void;
  "close-peer": (
    data: { roomId: string; peerId: string; userId: string },
    send: (obj: any) => void
  ) => void;
  "destroy-room": (
    data: { roomId: string; peerId: string },
    send: (obj: any) => void
  ) => void;
  "connect-transport": (
    data: {
      roomId: string;
      peerId: string;
      dtlsParameters: DtlsParameters;
      direction: string;
    },
    send: (obj: any) => void
  ) => void;
  "get-recv-tracks": (
    data: { roomId: string; peerId: string; rtpCapabilities: RtpCapabilities },
    send: (obj: any) => void
  ) => void;
  "send-track": (data: handlerParams, send: (obj: any) => void) => void;
};
export const startRabbit = async (handler: handlerMap) => {
  const sendQueue = "sendqueue";
  const recvQueue = "recvqueue";
  const onlineQueue = "onlinequeue";

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
    setTimeout(async () => await startRabbit(handler), 2000);
    return;
  }
  console.log("[rabbitmq]: rabbit connected");
  const channel = await conn.createChannel();
  await Promise.all([
    channel.assertQueue(recvQueue),
    channel.assertQueue(sendQueue),
    channel.assertQueue(onlineQueue),
  ]);

  const send = (obj: any) => {
    channel.sendToQueue(sendQueue, Buffer.from(JSON.stringify(obj)));
  };
  await channel.purgeQueue(recvQueue);

  await channel.consume(
    recvQueue,
    async e => {
      const m = e?.content.toString();
      const data = JSON.parse(m as string);
      const { op, d } = data;
      handler[op as keyof handlerMap](d, send);
    },
    { noAck: true }
  );

  channel.sendToQueue(
    onlineQueue,
    Buffer.from(JSON.stringify({ op: "online" }))
  );
};
