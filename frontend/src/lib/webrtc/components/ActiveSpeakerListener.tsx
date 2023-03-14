import hark from "hark";
import { userAgent } from "next/server";
import { useContext, useEffect } from "react";
import { userContext } from "../../../contexts/UserContext";
import { WebSocketContext } from "../../../contexts/WebsocketContext";
import { useVoiceStore } from "../store/useVoiceStore";

interface IProps {}

export const ActiveSpeakerListener: React.FC<IProps> = ({}) => {
  const { conn } = useContext(WebSocketContext);
  const { micStream, roomId} = useVoiceStore();
  const { data: user, isLoading: userLoading } = useContext(userContext);
  useEffect(() => {
    if (!micStream || !conn || userLoading) {
      return;
    }

    const harker = hark(micStream);

    harker.on("speaking", () => {
      console.log('speaking')
      conn.emit("user-started-speaking", { userId: user.userid, roomId });
    });
    harker.on("stopped_speaking", () => {
      conn.emit("user-stopped-speaking", { userId: user.userid, roomId });
    });

    return () => {
      harker.stop();
    };
  }, [micStream, conn]);

  return null;
};
