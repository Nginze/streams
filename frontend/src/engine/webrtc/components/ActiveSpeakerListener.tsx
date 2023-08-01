import hark from "hark";
import { useContext, useEffect } from "react";
import { userContext } from "../../../contexts/UserContext";
import { WebSocketContext } from "../../../contexts/WebsocketContext";
import { useVoiceStore } from "../store/useVoiceStore";
import { useProducerStore } from "../store/useProducerStore";

interface Props {}

export const ActiveSpeakerListener: React.FC<Props> = ({}) => {
  const { conn } = useContext(WebSocketContext);
  const { micStream, roomId } = useVoiceStore();
  const { producer } = useProducerStore();

  const { user, userLoading } = useContext(userContext);

  useEffect(() => {
    if (!micStream || !conn || userLoading) {
      return;
    }

    const harker = hark(micStream);

    harker.on("speaking", () => {
      conn.emit("presence:speaking", { userId: user.userId, roomId });
    });

    harker.on("stopped_speaking", () => {
      conn.emit("presence:not_speaking", { userId: user.userId, roomId });
    });

    return () => {
      harker.stop();
    };
  }, [micStream, conn]);

  return null;
};
