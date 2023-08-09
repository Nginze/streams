import { Button } from "@/components/ui/button";
import { useRoomInviteModal } from "@/store/useRoomInviteModal";
import { useSoundEffectStore } from "@/store/useSoundEffectStore";
import { useConsumerStore } from "@/engine/webrtc/store/useConsumerStore";
import { useProducerStore } from "@/engine/webrtc/store/useProducerStore";
import { useVoiceStore } from "@/engine/webrtc/store/useVoiceStore";
import { Check, X } from "lucide-react";
import { useRouter } from "next/router";
import { useContext, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useQueryClient } from "react-query";
import { userContext } from "../../contexts/UserContext";
import { WebSocketContext } from "../../contexts/WebsocketContext";
import { api } from "@/api";
import { useSettingStore } from "@/store/useSettingStore";

type Props = {
  children: React.ReactNode;
};

export const MainWsHandler = ({ children }: Props) => {
  const { userLoading, user } = useContext(userContext);
  const { conn } = useContext(WebSocketContext);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { nullify, mic } = useVoiceStore();
  const { closeAll } = useConsumerStore();
  const { close } = useProducerStore();
  const { setModalRoom, setModalUser, showInvite } = useRoomInviteModal();

  const playSoundEffect = useSoundEffectStore(x => x.playSoundEffect);

  useEffect(() => {
    if (!conn) {
      return;
    }

    conn.on("active-speaker-change", ({ userId, roomId, status }) => {
      if (status == "speaking") {
        queryClient.setQueryData(["room", roomId], (data: any) => ({
          ...data,
          participants: data.participants.map((p: RoomParticipant) =>
            p.userId === userId
              ? {
                  ...p,
                  indicatorOn:
                    p.isSpeaker || data.creatorId === userId ? true : false,
                }
              : p
          ),
        }));
      } else {
        queryClient.setQueryData(["room", roomId], (data: any) => ({
          ...data,
          participants: data.participants.map((p: RoomParticipant) =>
            p.userId === userId
              ? {
                  ...p,
                  indicatorOn: false,
                }
              : p
          ),
        }));
      }
    });
    conn.on("room-destroyed", () => {});
    conn.on("speaker-removed", ({ roomId, userId }) => {
      console.log("speaker-removed", userId);
      queryClient.setQueryData(["room", roomId], (data: any) => ({
        ...data,
        participants: data.participants.map((p: RoomParticipant) =>
          p.userId === userId
            ? {
                ...p,
                isSpeaker: false,
                raisedHand: false,
                isMuted: true,
              }
            : p
        ),
      }));
    });
    conn.on("speaker-added", ({ userId, roomId }) => {
      console.log("new-speaker-added", userId, roomId);
      queryClient.setQueryData(["room", roomId], (data: any) => ({
        ...data,
        participants: data.participants.map((p: RoomParticipant) =>
          p.userId === userId
            ? {
                ...p,
                raisedHand: false,
                isSpeaker: true,
                isMuted: true,
              }
            : p
        ),
      }));
    });

    conn.on("add-speaker-permissions", ({ roomId }) => {
      console.log("i just received a request to add speaker permissions");
      queryClient.setQueriesData(["room-status", roomId], (data: any) => ({
        ...data,
        isSpeaker: true,
        raisedHand: false,
      }));
    });

    conn.on("remove-speaker-permissions", ({ roomId }) => {
      console.log("i just received a request to remove speaker permissions");

      queryClient.setQueriesData(["room-status", roomId], (data: any) => ({
        ...data,
        isSpeaker: false,
      }));

      if (!mic) {
        return;
      }

      mic.enabled ? (mic.enabled = false) : (mic.enabled = true);
    });

    conn.on("user-left-room", ({ userId, roomId }) => {
      console.log("user-left-room received", userId);
      queryClient.invalidateQueries(["people"]);
      queryClient.setQueryData(["room", roomId], (data: any) => ({
        ...data,
        participants: data.participants.filter(
          (p: RoomParticipant) => p.userId !== userId
        ),
      }));
    });

    conn.on("new-user-joined-room", ({ user, roomId }) => {
      console.log("new user joined fired");
      queryClient.invalidateQueries(["people"]);
      queryClient.setQueryData(["room", roomId], (data: any) => {
        const exists = data.participants.some(
          (p: RoomParticipant) => p.userId === user.userId
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
        participants: data.participants.map((p: RoomParticipant) =>
          p.userId === userId
            ? {
                ...p,
                raisedHand: !p.raisedHand,
              }
            : p
        ),
      }));
    });

    conn.on("hand-down", ({ userId, roomId }) => {
      console.log("You lowered your hand");

      queryClient.setQueryData(["room", roomId], (data: any) => ({
        ...data,
        participants: data.participants.map((p: RoomParticipant) =>
          p.userId === userId
            ? {
                ...p,
                raisedHand: !p.raisedHand,
              }
            : p
        ),
      }));
    });

    conn.on("mute-changed", ({ userId, roomId }) => {
      console.log("User muted mic");
      queryClient.setQueryData(["room", roomId], (data: any) => ({
        ...data,
        participants: data.participants.map((p: RoomParticipant) =>
          p.userId === userId
            ? {
                ...p,
                isMuted: !p.isMuted,
              }
            : p
        ),
      }));
    });

    conn.on("mod-added", ({ userId, roomId }) => {
      console.log("user promoted to mod");
      queryClient.setQueryData(["room", roomId], (data: any) => ({
        ...data,
        participants: data.participants.map((p: RoomParticipant) =>
          p.userId === userId
            ? {
                ...p,
                isMod: true,
              }
            : p
        ),
      }));
    });

    conn.on("mod-removed", ({ userId, roomId }) => {
      console.log("user demoted from mod");
      queryClient.setQueryData(["room", roomId], (data: any) => ({
        ...data,
        participants: data.participants.map((p: RoomParticipant) =>
          p.userId === userId
            ? {
                ...p,
                isMod: false,
              }
            : p
        ),
      }));
    });

    conn.on("you-are-now-a-mod", ({ roomId }) => {
      console.log("i am now a mod");
      queryClient.setQueryData(["room-status", roomId], (data: any) => ({
        ...data,
        isMod: true,
      }));
    });

    conn.on("you-are-no-longer-a-mod", ({ roomId }) => {
      queryClient.setQueryData(["room-status", roomId], (data: any) => ({
        ...data,
        isMod: false,
      }));
    });

    conn.on("invalidate-participants", ({ roomId }) => {
      queryClient.refetchQueries(["room", roomId]);
    });

    conn.on("invalidate-feed", () => {
      queryClient.refetchQueries(["live-rooms"]);
    });

    conn.on("toggle-room-chat", ({ roomId }) => {
      console.log("chat is about to be toggled");
      queryClient.setQueryData(["room", roomId], (data: any) => ({
        ...data,
        chatEnabled: !data.chatEnabled,
      }));
    });

    conn.on("toggle-hand-raise-enabled", ({ roomId }) => {
      console.log("handraise is about to be toggled");
      queryClient.setQueryData(["room", roomId], (data: any) => ({
        ...data,
        handRaiseEnabled: !data.handRaiseEnabled,
      }));
    });

    conn.on("leave-room", async ({ roomId, byHost }) => {
      nullify();
      closeAll();
      close();
      if (router.pathname != "/home") {
        await router.push("/");
      }
      queryClient.invalidateQueries(["user"]);
      queryClient.refetchQueries(["live-rooms"]);
      queryClient.removeQueries(["room"]);
      queryClient.removeQueries(["room-status"]);
      queryClient.removeQueries(["room-chat"]);
      // if (!byHost) {
      // } else {
      //   setTimeout(async () => {
      //     await router.push("/");
      //     queryClient.invalidateQueries(["user"]);
      //     queryClient.removeQueries(["room"]);
      //     queryClient.removeQueries(["room-status"]);
      //     queryClient.removeQueries(["room-chat"]);
      //   }, 10000);
      // }
    });

    conn.on("leave-room-all", async ({ roomId, hostId }) => {
      conn?.emit("action:leave_room", { roomId, byHost: true });
      toast("Room ended", {
        icon: "👋",
      });
      // console.log("forced to leave room");

      // await api.post(`/room/leave?roomId=${roomId}`).then(res => {
      //   conn?.emit("leave-room", { roomId });
      //   nullify();
      //   closeAll();
      //   close();
      // });

      // if (user.userId == hostId) {
      //   await router.push("/");
      //   toast("Meeting ended", {
      //     icon: "ℹ",
      //     style: {
      //       borderRadius: "10px",
      //       background: "#333",
      //       color: "#fff",
      //     },
      //   });
      // } else {
      //   await router.push("/");

      //   toast("Host ended meeting", {
      //     icon: "🔔",
      //     style: {
      //       borderRadius: "10px",
      //       background: "#333",
      //       color: "#fff",
      //     },
      //   });
      // }

      // queryClient.invalidateQueries(["user"]);
      // queryClient.removeQueries(["room"]);
      // queryClient.removeQueries(["room-status"]);
      // queryClient.removeQueries(["room-chat"]);
      // queryClient.removeQueries(["room-bans"]);
    });

    conn.on("room-invite", ({ room, user }) => {
      console.log("i was invited to a room");
      const { roomInvites: allowInvites } = useSettingStore.getState();
      if (allowInvites) {
        playSoundEffect("roomInvite");
        toast.custom(t => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-md w-full bg-app_bg_deeper shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-full p-4 flex justify-between items-center">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <img
                    className="h-10 w-10 rounded-full"
                    src={user.avatarUrl}
                    alt=""
                  />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-white">
                    {user.userName}
                  </p>
                  <p className="mt-1 text-sm text-white w-52 truncate">
                    invites you to {room.roomDesc}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 px-3">
              <div>
                <Button
                  onClick={() => {
                    toast.dismiss(t.id);
                    router.push(`/room/${room.roomId}`);
                  }}
                  className="bg-green-400 p-4"
                >
                  <Check size={12} />
                </Button>
              </div>
              <div className="flex border-l border-app_bg_light py-2 px-2">
                <Button
                  onClick={() => toast.dismiss(t.id)}
                  className="bg-[#FF5E5E] p-4"
                >
                  <X size={12} />
                </Button>
              </div>
            </div>
          </div>
        ));
      }
    });

    conn.on("room-name-changed", ({ roomId, newRoomName }) => {
      queryClient.setQueryData(["room", roomId], (data: any) => ({
        ...data,
        roomDesc: newRoomName,
      }));
    });

    conn.on("ban-list-change", ({ roomId, banType, isBan, bannedUser }) => {
      if (bannedUser.userId == user.userId) {
        toast(
          `You've been ${isBan ? "unbanned" : "banned"} from ${
            banType.split("_")[0]
          }`,
          {
            // icon: "ℹ",
            style: {
              // borderRadius: "10px",
              // background: "#333",
              // color: "#fff",
            },
          }
        );
      } else {
        toast(`${bannedUser.userName} ${isBan ? "unbanned" : "banned"}`, {
          // icon: "ℹ",
          // style: {
          //   borderRadius: "10px",
          //   background: "#333",
          //   color: "#fff",
          // },
        });
      }

      if (isBan) {
        queryClient.setQueryData(["room-bans", roomId], (data: any) =>
          data.filter((b: any) => b.userId != bannedUser.userId)
        );
      } else {
        queryClient.setQueryData(["room-bans", roomId], (data: any) => [
          ...data,
          bannedUser,
        ]);
      }
      queryClient.invalidateQueries(["room-bans", roomId]);
      // queryClient.invalidateQueries(["room", roomId])
    });

    conn.on("kicked-from-room", async ({ roomId }) => {
      await api.post(`/room/leave?roomId=${roomId}`).then(async res => {
        await router.push("/");
        toast("Host kicked you ⚒", {
          style: {
            // borderRadius: "10px",
            // background: "#333",
            // color: "#fff",
          },
        });
        conn?.emit("leave-room", { roomId });
        nullify();
        closeAll();
        close();

        queryClient.invalidateQueries(["user"]);
        queryClient.removeQueries(["room"]);
        queryClient.removeQueries(["room-status"]);
        queryClient.removeQueries(["room-chat"]);
        queryClient.removeQueries(["room-bans"]);
      });
    });

    conn.on("msg", () => {
      console.log("bull fucking works");
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
      conn.off("hand-down");
      conn.off("mute-changed");
      conn.off("add-speaker-permissions");
      conn.off("remove-speaker-permissions");
      conn.off("invalidate-participants");
      conn.off("toggle-room-chat");
      conn.off("toggle-hand-raise-enabled");
      conn.off("leave-room-all");
      conn.off("leave-room");
      conn.off("invalidate-feed");
      conn.off("room-invite");
      conn.off("ban-list-change");
      conn.off("kicked-from-room");
      conn.off("msg");
    };
  }, [conn, userLoading]);
  return <>{children}</>;
};
