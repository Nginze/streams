import {
  RtpCapabilities,
  RtpParameters,
} from "mediasoup-client/lib/RtpParameters";
import {
  DtlsParameters,
  Transport,
  TransportOptions,
} from "mediasoup-client/lib/Transport";
import { useRouter } from "next/router";
import React, { useContext, useEffect } from "react";
import { userContext } from "../../contexts/UserContext";
import { WebSocketContext } from "../../contexts/WebsocketContext";
import { ActiveSpeakerListener } from "./components/ActiveSpeakerListener";
import AudioRender from "./components/AudioRender";
import { useVoiceStore } from "./store/useVoiceStore";
import { consumeAudio } from "./utils/consumeAudio";
import { createTransport } from "./utils/createTransport";
import { joinRoom } from "./utils/joinRoom";
import { receiveVoice } from "./utils/receiveVoice";
import { sendVoice } from "./utils/sendVoice";

interface Props {}

export type RecvDTO = {
  roomId: string;
  peerId: string;
  routerRtpCapabilities?: RtpCapabilities;
  recvTransportOptions?: TransportOptions;
  sendTransportOptions?: TransportOptions;
  sendTransport?: Transport;
  dtlsParameters?: DtlsParameters;
  rtpCapabilities?: RtpCapabilities;
  rtpParameters?: RtpParameters;
  consumerParameters?: {
    producerId: string;
    id: string;
    kind: string;
    rtpParameters: RtpParameters;
    type: any;
    producerPaused: boolean;
  };
  consumerParametersArr?: any[];
  kicked?: boolean;
  userId?: string;
  transportId?: string;
  producerId?: String;
  direction?: string;
  kind?: string;
  paused?: boolean;
  appData?: any;
  error?: any;
  id?: string;
};

export function closeVoiceConnections(_roomId: string | null) {
  const { roomId, mic, nullify } = useVoiceStore.getState();
  if (_roomId === null || _roomId === roomId) {
    if (mic) {
      console.log("stopping mic");
      mic.stop();
    }

    console.log("nulling transports");
    nullify();
  }
}

const WebrtcApp: React.FC<Props> = () => {
  const { conn } = useContext(WebSocketContext);
  const { user, userLoading } = useContext(userContext);
  const router = useRouter();

  useEffect(() => {
    if (!conn || userLoading) {
      return;
    }

    conn.on("room-created", async (d: RecvDTO) => {
      router.push(`/room/${d.roomId}`);
    });

    conn.on("new-peer-speaker", async (d: RecvDTO) => {
      const { roomId, recvTransport } = useVoiceStore.getState();
      console.log("received new speaker params");
      if (recvTransport && roomId === d.roomId) {
        await consumeAudio(d.consumerParameters, d.peerId);
      }
    });
    
    conn.on("you-are-now-a-speaker", async (d: RecvDTO) => {
      if (d.roomId !== useVoiceStore.getState().roomId) {
        return;
      }
      try {
        await createTransport(
          conn,
          d.roomId,
          user.userId,
          "send",
          d.sendTransportOptions as TransportOptions
        );
      } catch (err) {
        console.log(err);
        return;
      }
      console.log("sending voice");
      try {
        await sendVoice();
      } catch (err) {
        console.log(err);
      }
    });

    conn.on("you-joined-as-a-peer", async (d: RecvDTO) => {
      console.log("you-joined as a peer");
      closeVoiceConnections(null);
      useVoiceStore.getState().set({ roomId: d.roomId });

      console.log("creating a device");
      try {
        await joinRoom(d.routerRtpCapabilities as RtpCapabilities);
      } catch (err) {
        console.log("error creating a device | ", err);
        return;
      }
      try {
        await createTransport(
          conn,
          d.roomId,
          d.userId as string,
          "recv",
          d.recvTransportOptions as TransportOptions
        );
      } catch (err) {
        console.log("error creating recv transport | ", err);
        return;
      }
      receiveVoice(conn, () => {}, user.userId);
    });

    conn.on("you-joined-as-a-speaker", async (d: RecvDTO) => {
      console.log(d);
      closeVoiceConnections(null);
      useVoiceStore.getState().set({ roomId: d.roomId });

      console.log("creating a device");
      try {
        await joinRoom(d.routerRtpCapabilities as RtpCapabilities);
      } catch (err) {
        console.log("error creating a device | ", err);
        return;
      }
      try {
        await createTransport(
          conn,
          d.roomId,
          d.userId as string,
          "send",
          d.sendTransportOptions as TransportOptions
        );
      } catch (err) {
        console.log("error creating send transport | ", err);
        return;
      }
      console.log("sending voice");

      try {
        await sendVoice();
      } catch (err) {
        console.log("error sending voice | ", err);
        return;
      }

      await createTransport(
        conn,
        d.roomId,
        user.userId,
        "recv",
        d.recvTransportOptions as TransportOptions
      );

      receiveVoice(conn, () => {}, user.userId);
    });

    return () => {
      conn.off("new-peer-speaker");
      conn.off("you-are-now-a-speaker");
      conn.off("you-joined-as-a-peer");
      conn.off("you-joined-as-a-speaker");
    };
  }, [conn, userLoading]);
  return (
    <>
      <AudioRender />
      <ActiveSpeakerListener />
    </>
  );
};

export default WebrtcApp;
