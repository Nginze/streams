import { useConsumerStore } from "../store/useConsumerStore";
import { useVoiceStore } from "../store/useVoiceStore";

export const consumeAudio = async (consumerParameters: any, peerId: string) => {
  const { recvTransport } = useVoiceStore.getState();
  if (!recvTransport) {
    console.log("skipping consumeAudio because recvTransport is null");
    return false;
  }

  const consumer = await recvTransport.consume({
    ...consumerParameters,
    appData: {
      peerId,
      producerId: consumerParameters.producerId,
      mediaTag: "cam-audio",
    },
  });
  console.log('finished creating consumer')
  useConsumerStore.getState().add(consumer, peerId);

  return true;
};
