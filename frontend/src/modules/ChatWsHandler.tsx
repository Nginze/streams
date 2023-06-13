import { useContext, useEffect } from "react";
import { useQueryClient } from "react-query";
import { userContext } from "../contexts/UserContext";
import { WebSocketContext } from "../contexts/WebsocketContext";
import { useVoiceStore } from "../lib/webrtc/store/useVoiceStore";
import { useSoundEffectStore } from "../global-stores/useSoundEffectStore";

interface Props {}

export const ChatWsHandler: React.FC<Props> = ({}) => {
  const { user, userLoading } = useContext(userContext);
  const { conn } = useContext(WebSocketContext);
  const queryClient = useQueryClient();
  const playSoundEffect = useSoundEffectStore(x => x.playSoundEffect);

  const generateColor = () => {
    const twitchColors = [
      "#9147FF", // Purple
      "#FF375F", // Red
      "#FF7B00", // Orange
      "#FFC700", // Yellow
      "#19CAAD", // Teal
      "#00C875", // Green
      "#0080FF", // Blue
      "#8257E5", // Indigo
    ];

    const randomIndex = Math.floor(Math.random() * twitchColors.length);
    return twitchColors[randomIndex];
  };

  const colors = [
    "#4ade80",
    "#22d3ee",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f43f5e",
  ];

  useEffect(() => {
    if (!conn) {
      return;
    }
    conn.on("new-chat-message", ({ message, roomId }) => {
      console.log("new-chat-message-received");

      const storedColor = localStorage.getItem("userColor");
      if (!storedColor) {
        const myColor = generateColor();
        localStorage.setItem("userColor", myColor);
      } else {
      }

      if (message?.reply && message?.reply.userId == user.userId) {
        playSoundEffect("roomChatMention");
      }

      queryClient.setQueryData(["room-chat", roomId], (data: any) =>
        !data
          ? {
              messages: [message],
            }
          : {
              ...data,
              messages: [...data?.messages, message],
            }
      );
    });
    return () => {
      conn.off("new-chat-message");
    };
  }, [conn, userLoading]);
  return null;
};
