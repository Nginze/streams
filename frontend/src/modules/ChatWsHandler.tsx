import { useContext, useEffect } from "react";
import { useQueryClient } from "react-query";
import { userContext } from "../contexts/UserContext";
import { WebSocketContext } from "../contexts/WebsocketContext";

interface Props {}

export const ChatWsHandler: React.FC<Props> = ({}) => {

  const { userLoading } = useContext(userContext);
  const { conn } = useContext(WebSocketContext);
  const queryClient = useQueryClient();

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
      const randomIndex = Math.floor(Math.random() * colors.length);
      message.color = colors[randomIndex];
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
