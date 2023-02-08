import { useVoiceStore } from "../store/useVoiceStore";
import { consumeAudio } from "./consumeAudio";

export const receiveVoice = (conn: any, flushQueue: () => void, userid: string) => {
  const {roomId} = useVoiceStore.getState()
  conn.once("get-recv-tracks-done", ({ consumerParametersArr }: any) => {
    console.log('consumerparamsrecv', consumerParametersArr)
    try {
      for (const { peerId, consumerParameters } of consumerParametersArr) {
        consumeAudio(consumerParameters, peerId);
      }
    } catch (err) {
      console.log(err);
    } finally {
      flushQueue();
    }
  });
  conn.emit("get-recv-tracks", {
    rtpCapabilities: useVoiceStore.getState().device!.rtpCapabilities,
    roomId,
    peerId: userid
  });
};
