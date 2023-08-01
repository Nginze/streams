import { TransportOptions } from "mediasoup-client/lib/types";
import { useVoiceStore } from "../store/useVoiceStore";
import { useRTCStore } from "../store/useRTCStore";
import { useProducerStore } from "../store/useProducerStore";

export async function createTransport(
  conn: any,
  _roomId: string,
  userid: string,
  direction: "recv" | "send",
  transportOptions: TransportOptions
) {
  console.log(`create ${direction} transport`);
  const { device, set, roomId } = useVoiceStore.getState();

  console.log("transport options", transportOptions);
  const transport =
    direction === "recv"
      ? await device!.createRecvTransport(transportOptions)
      : await device!.createSendTransport(transportOptions);

  transport.on("connect", ({ dtlsParameters }, callback, errback) => {
    conn.emit(
      `rtc:connect_transport`,
      {
        roomId,
        transportId: transportOptions.id,
        dtlsParameters,
        peerId: userid,
        direction,
      },
      () => callback()
    );
  });

  if (direction === "send") {
    // sending transports will emit a produce event when a new track
    // needs to be set up to start sending. the producer's appData is
    // passed as a parameter
    transport.on(
      "produce",
      ({ kind, rtpParameters, appData }, callback, errback) => {
        console.log("transport produce event", appData.mediaTag);
        // we may want to start out paused (if the checkboxes in the ui
        // aren't checked, for each media type. not very clean code, here
        // but, you know, this isn't a real application.)
        // let paused = false;
        // if (appData.mediaTag === "cam-video") {
        //   paused = getCamPausedState();
        // } else if (appData.mediaTag === "cam-audio") {
        //   paused = getMicPausedState();
        // }
        // tell the server what it needs to know from us in order to set
        // up a server-side producer object, and get back a
        // producer.id. call callback() on success or errback() on
        // failure.
        conn.once("@send-track-done", (d: any) => {
          console.log("@send-track-done");
          callback({ id: d.id });
        });
        conn.emit(
          "rtc:send_track",
          {
            roomId,
            peerId: userid,
            transportId: transportOptions.id,
            kind,
            rtpParameters,
            rtpCapabilities: device!.rtpCapabilities,
            paused: false,
            appData,
            direction,
          },
          (id: any) => callback({ id })
        );
      }
    );
  }

  // for this simple demo, any time a transport transitions to closed,
  // failed, or disconnected, leave the room and reset
  //
  transport.on("connectionstatechange", state => {
    useRTCStore.getState().set({ rtcStatus: state });
    console.log(
      `${direction} transport ${transport.id} connectionstatechange ${state}`
    );
  });

  if (direction === "recv") {
    set({ recvTransport: transport });
  } else {
    set({ sendTransport: transport });
  }
}
