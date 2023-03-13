import axios from "axios";
import { createContext, useContext, useEffect } from "react";
import { useQuery, useQueryClient } from "react-query";
import { userContext } from "../contexts/UserContext";
import { WebSocketContext } from "../contexts/WebsocketContext";

interface IProps {}

export const ChatWsHandler: React.FC<IProps> = ({}) => {
  const { data: user, isLoading } = useContext(userContext);
  const { conn } = useContext(WebSocketContext);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conn) {
      return;
    }
    conn.on("new-chat-message", ({ message, roomId }) => {
      console.log("new-chat-message-received");
      console.log(message);
      const colors = [
        "#4ade80",
        "#22d3ee",
        "#3b82f6",
        "#8b5cf6",
        "#ec4899",
        "#f43f5e",
      ];
      const randomIndex = Math.floor(Math.random() * colors.length);
      message.color = colors[randomIndex];
      queryClient.setQueryData(["roomchat", roomId], (data: any) =>
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
  }, [conn, isLoading]);
  return null;
};
