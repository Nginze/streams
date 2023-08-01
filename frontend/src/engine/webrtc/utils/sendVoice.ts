import { useProducerStore } from "../store/useProducerStore";
import { useVoiceStore } from "../store/useVoiceStore";

export const sendVoice = async () => {
  const { sendTransport, set, mic } = useVoiceStore.getState();
  if (!sendTransport) {
    console.log("no sendTransport in sendVoice");
    return;
  }
  // eslint-disable-next-line init-declarations
  let micStream: MediaStream;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
  } catch (err) {
    set({ mic: null, micStream: null });
    console.log(err);
    return;
  }

  const audioTracks = micStream.getAudioTracks();

  if (audioTracks.length) {
    console.log("creating producer...");
    const track = audioTracks[0];
    track.enabled = false
    useProducerStore.getState().add(
      await sendTransport.produce({
        track,
        appData: { mediaTag: "cam-audio" },
      })
    );
    

    set({ mic: track, micStream });
    

    return;
  }

  set({ mic: null, micStream: null });
};
