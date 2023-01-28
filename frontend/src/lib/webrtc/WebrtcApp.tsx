import React, { useContext, useEffect } from "react";
import { userContext } from "../../contexts/UserContext";
import { WebSocketContext } from "../../contexts/WebsocketContext";
import { ActiveSpeakerListener } from "./components/ActiveSpeakerListener";
import AudioRender from "./components/AudioRender";
import { useConsumerStore } from "./store/useConsumerStore";
import { useVoiceStore } from "./store/useVoiceStore";
import { consumeAudio } from "./utils/consumeAudio";
import { createTransport } from "./utils/createTransport";
import { joinRoom } from "./utils/joinRoom";
import { receiveVoice } from "./utils/receiveVoice";
import { sendVoice } from "./utils/sendVoice";

interface IProps {}

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

const WebrtcApp: React.FC<IProps> = () => {
  const { conn } = useContext(WebSocketContext);
  const { data: user, isLoading } = useContext(userContext);
  const { consumerMap } = useConsumerStore();

  useEffect(() => console.log(consumerMap), [consumerMap]);
  useEffect(() => {
    if (!conn || isLoading) {
      return;
    }

    conn.on("new-peer-speaker", async d => {
      const { roomId, recvTransport } = useVoiceStore.getState();
      console.log("received new speaker params");
      if (recvTransport && roomId === d.roomId) {
        console.log("does it even run");
        await consumeAudio(d.consumerParameters, d.peerId);
        console.log("new map", consumerMap);
      }
    });
    conn.on("you-are-now-a-speaker", async d => {
      if (d.roomId !== useVoiceStore.getState().roomId) {
        return;
      }
      try {
        await createTransport(
          conn,
          d.roomId,
          user.userid,
          "send",
          d.sendTransportOptions
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
    conn.on("you-joined-as-a-peer", async d => {
      closeVoiceConnections(null);
      useVoiceStore.getState().set({ roomId: d.roomId });

      console.log("creating a device");
      try {
        await joinRoom(d.routerRtpCapabilities);
      } catch (err) {
        console.log("error creating a device | ", err);
        return;
      }
      try {
        await createTransport(
          conn,
          d.roomId,
          user.userid,
          "recv",
          d.recvTransportOptions
        );
      } catch (err) {
        console.log("error creating recv transport | ", err);
        return;
      }
      receiveVoice(conn, () => {}, user.userid);
    });

    conn.on("you-joined-as-a-speaker", async d => {
      console.log(d);
      closeVoiceConnections(null);
      useVoiceStore.getState().set({ roomId: d.roomId });

      console.log("creating a device");
      try {
        await joinRoom(d.routerRtpCapabilities);
      } catch (err) {
        console.log("error creating a device | ", err);
        return;
      }
      try {
        await createTransport(
          conn,
          d.roomId,
          user.userid,
          "send",
          d.sendTransportOptions
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
        user.userid,
        "recv",
        d.recvTransportOptions
      );

      receiveVoice(conn, () => {}, user.userid);
    });


    return () => {
      conn.off("new-peer-speaker");
      conn.off("you-are-now-a-speaker");
      conn.off("you-joined-as-a-peer");
      conn.off("you-joined-as-a-speaker");
    };
  }, [conn, isLoading]);
  return (
    <>
      <AudioRender />
      <ActiveSpeakerListener />
    </>
  );
};

export default WebrtcApp;
