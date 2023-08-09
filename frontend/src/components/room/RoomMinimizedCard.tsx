import React from "react";
import { Button } from "../ui/button";
import { Mic, MicOff, PhoneMissed } from "lucide-react";
import { Socket } from "socket.io-client";
import { TbHandOff } from "react-icons/tb";
import { MdOutlineWavingHand } from "react-icons/md";
import { useVoiceStore } from "@/engine/webrtc/store/useVoiceStore";
import { useMutation, useQueryClient } from "react-query";
import { useRouter } from "next/router";
import { useConsumerStore } from "@/engine/webrtc/store/useConsumerStore";
import { useProducerStore } from "@/engine/webrtc/store/useProducerStore";
import { useSoundEffectStore } from "@/store/useSoundEffectStore";
import { api } from "@/api";

type Props = {
  conn: Socket | null;
  myRoomStatus: RoomStatus;
  room: Room;
  user: User;
};

const RoomMinimizedCard = ({ conn, myRoomStatus, room, user }: Props) => {
  const { mic, nullify } = useVoiceStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { closeAll } = useConsumerStore();
  const { close, producer } = useProducerStore();

  const parseCamel = (snake: string) => {
    return snake.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
  };

  const playSoundEffect = useSoundEffectStore(x => x.playSoundEffect);

  const statusMutation = useMutation({
    mutationFn: async (params: {
      state: string;
      value: boolean;
      userId: string;
    }) => {
      await api.put(
        `/room/room-status/update/${params.userId}?state=${params.state}&value=${params.value}&roomId=${room.roomId}`
      );
    },

    onMutate: async variables => {
      await queryClient.cancelQueries(["room-status", room.roomId]);

      const previousRoomStatus = queryClient.getQueryData([
        "room-status",
        room.roomId,
      ]);

      if (variables.userId === user.userId) {
        queryClient.setQueryData(["room-status", room.roomId], (data: any) => ({
          ...data,
          [parseCamel(variables.state)]: variables.value,
        }));
      }

      return { previousRoomStatus };
    },

    onSuccess: () => {},

    onError: (error, variables, context) => {
      if (variables.userId === user.userId) {
        queryClient.setQueryData(
          ["room-status", room.roomId],
          context!.previousRoomStatus
        );
      }
    },
  });

  const handleMute = async () => {
    if (!conn || !mic) {
      return;
    }
    const event = myRoomStatus.isMuted ? "action:unmute" : "action:mute";
    myRoomStatus.isMuted ? playSoundEffect("unmute") : playSoundEffect("mute");

    conn.emit(event, { roomId: room.roomId, userId: user.userId });
    mic?.enabled ? (mic.enabled = false) : (mic.enabled = true);

    try {
      statusMutation.mutate({
        state: "is_muted",
        value: !myRoomStatus.isMuted,
        userId: user.userId,
      });
    } catch (err) {}
  };

  const handleHandRaise = async () => {
    if (!conn) {
      return;
    }

    const event = myRoomStatus.raisedHand
      ? "action:hand_down"
      : "action:hand_raise";

    myRoomStatus.raisedHand
      ? playSoundEffect("unmute")
      : playSoundEffect("mute");
    conn.emit(event, { roomId: room.roomId, userId: user.userId });
    try {
      statusMutation.mutate({
        state: "raised_hand",
        value: !myRoomStatus.raisedHand,
        userId: user.userId,
      });
    } catch (err) {}
  };

  const handleLeave = async () => {
    try {
      if (room.creatorId == user.userId) {
        conn?.emit("mod:leave_room_all", {
          roomId: room.roomId,
          hostId: user.userId,
        });
      } else {
        conn?.emit("action:leave_room", { roomId: room.roomId });
      }
    } catch (error) {
      console.log(error);
      router.push("/");
    }
  };
  return (
    <div className="fixed left-1/2 transform -translate-x-1/2 bottom-4">
      <div className="w-auto bg-app_bg_deepest rounded-lg p-3 text-center space-x-5 text-white flex items-center shadow-app_shadow cursor-pointer">
        <div className="flex items-start flex-col">
          <span className="text-[10px] opacity-50 ">Currently in</span>
          <span className="opacity-70 text-[14px]">{room.roomDesc}</span>
        </div>
        <span className="flex items-center space-x-2">
          {(myRoomStatus.isSpeaker || room.handRaiseEnabled) && (
            <Button
              onClick={myRoomStatus.isSpeaker ? handleMute : handleHandRaise}
              className={`${
                myRoomStatus!.isMuted || myRoomStatus!.raisedHand
                  ? "bg-app_bg_deeper"
                  : "bg-app_cta "
              } shadow-app_shadow px-8`}
            >
              {myRoomStatus.isSpeaker ? (
                myRoomStatus!.isMuted ? (
                  <MicOff size={16} />
                ) : (
                  <Mic size={16} />
                )
              ) : myRoomStatus!.raisedHand ? (
                <TbHandOff fontSize={"1.2rem"} />
              ) : (
                <MdOutlineWavingHand size={16} />
              )}
            </Button>
          )}
          <Button
            onClick={handleLeave}
            className={`${true ? "bg-app_bg_deeper" : "bg-app_cta "} px-4`}
          >
            {room!.creatorId == user.userId ? (
              <span>
                <PhoneMissed size={16} />
              </span>
            ) : (
              <span className="text-lg">✌</span>
            )}
          </Button>
        </span>
      </div>
    </div>
  );
};

export default RoomMinimizedCard;
