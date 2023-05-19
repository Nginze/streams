import { useContext, useEffect } from "react";
import { useQueryClient } from "react-query";
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
                  active:
                    u.isspeaker || data.creatorid === userId ? true : false,
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
                  active: false,
                }
              : u
          ),
        }));
      }
    });
    conn.on("room-destroyed", () => {});
    conn.on("speaker-removed", ({ roomId, userId }) => {
      console.log("speaker-removed", userId);
      queryClient.setQueryData(["room", roomId], (data: any) => ({
        ...data,
        participants: data.participants.map((u: any) =>
          u.userid === userId
            ? {
                ...u,
                isspeaker: false,
                askedtospeak: false,
              }
            : u
        ),
      }));
    });
    conn.on("speaker-added", ({ userId, roomId }) => {
      console.log("new-speaker-added", userId);
      queryClient.setQueryData(["room", roomId], (data: any) => ({
        ...data,
        participants: data.participants.map((u: any) =>
          u.userid === userId
            ? {
                ...u,
                askedtospeak: false,
                isspeaker: true,
              }
            : u
        ),
      }));
    });

    conn.on("add-speaker-permissions", ({ userId, roomId }) => {
      console.log("i just received a request to add speaker permissions");
      queryClient.setQueriesData(["room-permissions", roomId], (data: any) => ({
        ...data,
        isspeaker: true,
        askedtospeak: false,
      }));
    });

    conn.on("remove-speaker-permissions", ({ userId, roomId }) => {
      console.log("i just received a request to remove speaker permissions");
      queryClient.setQueriesData(["room-permissions", roomId], (data: any) => ({
        ...data,
        isspeaker: false,
      }));
    });

    conn.on("user-left-room", ({ userId, roomId }) => {
      console.log("user-left-room received", userId);
      queryClient.setQueryData(["room", roomId], (data: any) => ({
        ...data,
        participants: data.participants.filter((u: any) => u.userid !== userId),
      }));
    });
    conn.on("new-user-joined-room", ({ user, roomId }) => {
      console.log("new user joined fired");
      queryClient.setQueryData(["room", roomId], (data: any) => {
        const exists = data.participants.some(
          (u: any) => u.userid === user.userid
        );
        if (!exists) {
          return {
            ...data,
            participants: [...data.participants, user],
          };
        } else {
          return data;
        }
      });
    });
    conn.on("hand-raised", ({ userId, roomId }) => {
      console.log("You raised your hand");

      queryClient.setQueryData(["room", roomId], (data: any) => ({
        ...data,
        participants: data.participants.map((u: any) =>
          u.userid === userId
            ? {
                ...u,
                askedtospeak: !u.askedtospeak,
              }
            : u
        ),
      }));
    });
    conn.on("mute-changed", ({ userId, roomId }) => {
      console.log("User muted mic");
      queryClient.setQueryData(["room", roomId], (data: any) => ({
        ...data,
        participants: data.participants.map((u: any) =>
          u.userid === userId
            ? {
                ...u,
                muted: !u.muted,
              }
            : u
        ),
      }));
    });

    conn.on("mod-added", ({ userId, roomId }) => {
      console.log("user promoted to mod");
      queryClient.setQueryData(["room", roomId], (data: any) => ({
        ...data,
        participants: data.participants.map((u: any) =>
          u.userid === userId
            ? {
                ...u,
                ismod: true,
              }
            : u
        ),
      }));
    });

    conn.on("mod-removed", ({ userId, roomId }) => {
      console.log("user demoted from mod");
      queryClient.setQueryData(["room", roomId], (data: any) => ({
        ...data,
        participants: data.participants.map((u: any) =>
          u.userid === userId
            ? {
                ...u,
                ismod: false,
              }
            : u
        ),
      }));
    });

    conn.on("you-are-now-a-mod", ({ roomId }) => {
      console.log("i am now a mod");
      queryClient.setQueryData(["room-permissions", roomId], (data: any) => ({
        ...data,
        ismod: true,
      }));
    });

    conn.on("you-are-no-longer-a-mod", ({ roomId }) => {
      queryClient.setQueryData(["room-permissions", roomId], (data: any) => ({
        ...data,
        ismod: false,
      }));
    });

    return () => {
      conn.off("mod-added");
      conn.off("you-are-now-a-mod");
      conn.off("active-speaker-change");
      conn.off("room-destroyed");
      conn.off("speaker-removed");
      conn.off("speaker-added");
      conn.off("user-left-room");
      conn.off("new-user-joined-room");
      conn.off("hand-raised");
      conn.off("mute-changed");
      conn.off("add-speaker-permissions");
      conn.off("remove-speaker-permissions");
    };
  }, [conn, isLoading]);
  return <>{children}</>;
};
