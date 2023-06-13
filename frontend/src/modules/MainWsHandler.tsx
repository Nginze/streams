import { useContext, useEffect } from "react";
import { useQueryClient } from "react-query";
import { userContext } from "../contexts/UserContext";
import { WebSocketContext } from "../contexts/WebsocketContext";
import { useRouter } from "next/router";
import { apiClient } from "@/lib/apiclient/client";
import { useConsumerStore } from "@/lib/webrtc/store/useConsumerStore";
import { useProducerStore } from "@/lib/webrtc/store/useProducerStore";
import { useVoiceStore } from "@/lib/webrtc/store/useVoiceStore";
import { useRoomInviteModal } from "@/global-stores/useRoomInviteModal";
import { useToast } from "@/components/ui/use-toast";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { useSoundEffectStore } from "@/global-stores/useSoundEffectStore";

type Props = {
  children: React.ReactNode;
};

export const MainWsHandler = ({ children }: Props) => {
  const { userLoading, user } = useContext(userContext);
  const { conn } = useContext(WebSocketContext);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { nullify } = useVoiceStore();
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
              }
            : p
        ),
      }));
    });
    conn.on("speaker-added", ({ userId, roomId }) => {
      console.log("new-speaker-added", userId);
      queryClient.setQueryData(["room", roomId], (data: any) => ({
        ...data,
        participants: data.participants.map((p: RoomParticipant) =>
          p.userId === userId
            ? {
                ...p,
                raisedHand: false,
                isSpeaker: true,
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
      queryClient.setQueryData(["room-permissions", roomId], (data: any) => ({
        ...data,
        isMod: true,
      }));
    });

    conn.on("you-are-no-longer-a-mod", ({ roomId }) => {
      queryClient.setQueryData(["room-permissions", roomId], (data: any) => ({
        ...data,
        isMod: false,
      }));
    });

    conn.on("invalidate-participants", ({ roomId }) => {
      queryClient.refetchQueries(["room", roomId]);
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

    conn.on("leave-room-all", async ({ roomId, hostId }) => {
      console.log("forced to leave room");

      await apiClient.post(`/room/leave?roomId=${roomId}`).then(res => {
        conn?.emit("leave-room", { roomId });
        nullify();
        closeAll();
        close();
      });

      if (user.userId == hostId) {
        console.log("you are the host");
        await apiClient.post(`/room/destroy?roomId=${roomId}`);
        await router.push("/");
        alert("you ended meeting");
      } else {
        await router.push("/");
        alert("host ended meeting");
        console.log("host ended meeting");
      }

      queryClient.invalidateQueries(["user"]);
      queryClient.removeQueries(["room"]);
      queryClient.removeQueries(["room-status"]);
      queryClient.removeQueries(["room-chat"]);
    });

    conn.on("room-invite", ({ room, user }) => {
      console.log("i was invited to a room");
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
                  Come hangout with me in {room.roomDesc}
                </p>
              </div>
            </div>
            <div>
              <Button
                onClick={() => router.push(`/room/${room.roomId}`)}
                className="bg-green-400"
              >
                Accept
              </Button>
            </div>
          </div>
          <div className="flex border-l border-app_bg_light">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-app_cta hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Ignore
            </button>
          </div>
        </div>
      ));
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
      conn.off("invalidate-participants");
      conn.off("toggle-room-chat");
      conn.off("toggle-hand-raise-enabled");
      conn.off("leave-room-all");
      conn.off("room-invite");
    };
  }, [conn, userLoading]);
  return <>{children}</>;
};
