import axios from "axios";
import { createContext, useContext, useEffect } from "react";
import { useQuery, useQueryClient } from "react-query";
import { userContext } from "../contexts/UserContext";
import { WebSocketContext } from "../contexts/WebsocketContext";

type Props = {
  children: React.ReactNode;
};

export const MainWsHandler = ({ children }: Props) => {
  const { data: user, isLoading } = useContext(userContext);
  const { conn } = useContext(WebSocketContext);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conn) {
      return;
    }

    conn.on("active-speaker-change", ({ userId, roomId, status }) => {
      if (status == "speaking") {
        queryClient.setQueryData(["room", roomId], (data: any) => ({
          ...data,
          participants: data.participants.map((u: any) =>
            u.userid === userId
              ? {
                  ...u,
                  isspeaking: u.isspeaker ? true : false,
                }
              : u
          ),
        }));
      } else {
        queryClient.setQueryData(["room", roomId], (data: any) => ({
          ...data,
          participants: data.participants.map((u: any) =>
            u.userid === userId
              ? {
                  ...u,
                  isspeaking: false,
                }
              : u
          ),
        }));
      }
    });
    conn.on("room-destroyed", () => {});
    conn.on("speaker-removed", () => {});
    conn.on("speaker-added", () => {});
    conn.on("user-left-room", ({ peerId, roomId }) => {
      queryClient.setQueryData(["room", roomId], (data: any) => ({
        ...data,
        participants: data.participants.filter((u: any) => u.userid !== peerId),
      }));
    });
    conn.on("new-user-joined-room", ({ peer, roomId }) => {
      console.log("new user joined fired");
      queryClient.setQueryData(["room", roomId], (data: any) => ({
        ...data,
        participants: [...data.participants, peer],
      }));
    });
    conn.on("hand-raised", () => {});
    conn.on("mute-changed", () => {});

    return () => {
      conn.off("active-speaker-change");
      conn.off("room-destroyed");
      conn.off("speaker-removed");
      conn.off("speaker-added");
      conn.off("user-left-room");
      conn.off("new-user-joined-room");
      conn.off("hand-raised");
      conn.off("mute-changed");
    };
  }, [conn, isLoading]);
  return <>{children}</>;
};
