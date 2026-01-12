import { toast } from "react-hot-toast";
import {
  BsChatLeft,
  BsGear,
  BsMic,
  BsMicMute,
  BsPersonPlus,
  BsTelephoneX,
} from "react-icons/bs";
import { MdOutlineWavingHand } from "react-icons/md";
import { TbHandOff } from "react-icons/tb";
import { useMutation, useQueryClient } from "react-query";
import { Socket } from "socket.io-client";
import { api } from "../../api";
import { useVoiceStore } from "../../engine/webrtc/store/useVoiceStore";
import { useSoundEffectStore } from "../../store/useSoundEffectStore";
import { Button } from "../ui/button";
import {
  MessageSquare,
  Mic,
  MicOff,
  PhoneCall,
  PhoneMissed,
  UserPlus,
} from "lucide-react";
import AppDialog from "../global/AppDialog";
import RoomShare from "./RoomShare";
import { useConsumerStore } from "@/engine/webrtc/store/useConsumerStore";
import { useProducerStore } from "@/engine/webrtc/store/useProducerStore";
import { useRouter } from "next/router";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { TooltipArrow } from "@radix-ui/react-tooltip";
import useScreenType from "@/hooks/useScreenType";
import ProfileSheet from "../global/ProfileSheet";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import RoomChatArea from "./RoomChatArea";
import useLoadRoomMeta from "@/hooks/useLoadRoomMeta";
import { useEffect, useState } from "react";

type Props = {
  conn: Socket | null;
  myRoomStatus: RoomStatus;
  roomId: String;
  room: Room;
  user: User;
};

const RoomControls = ({ conn, myRoomStatus, roomId, room, user }: Props) => {
  const { mic, nullify } = useVoiceStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [chatOpen, setChatOpen] = useState(false);

  const { closeAll } = useConsumerStore();
  const { close, producer } = useProducerStore();
  const myDevice = useScreenType();

  const parseCamel = (snake: string) => {
    return snake.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
  };

  const playSoundEffect = useSoundEffectStore((x) => x.playSoundEffect);

  const { chatMessages } = useLoadRoomMeta(roomId as string, user, true);

  const statusMutation = useMutation({
    mutationFn: async (params: {
      state: string;
      value: boolean;
      userId: string;
    }) => {
      await api.put(
        `/room/room-status/update/${params.userId}?state=${params.state}&value=${params.value}&roomId=${roomId}`
      );
    },

    onMutate: async (variables) => {
      await queryClient.cancelQueries(["room-status", roomId]);

      const previousRoomStatus = queryClient.getQueryData([
        "room-status",
        roomId,
      ]);

      if (variables.userId === user.userId) {
        queryClient.setQueryData(["room-status", roomId], (data: any) => ({
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
          ["room-status", roomId],
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

    conn.emit(event, { roomId, userId: user.userId });
    mic?.enabled ? (mic.enabled = false) : (mic.enabled = true);

    try {
      statusMutation.mutate({
        state: "isMuted",
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
    conn.emit(event, { roomId, userId: user.userId });
    try {
      statusMutation.mutate({
        state: "raisedHand",
        value: !myRoomStatus.raisedHand,
        userId: user.userId,
      });
    } catch (err) {}
  };

  const handleLeave = async () => {
    try {
      if (room.creatorId == user.userId) {
        conn?.emit("mod:leave_room_all", { roomId, hostId: user.userId });
      } else {
        conn?.emit("action:leave_room", { roomId });
        // await api.post(`/room/leave?roomId=${roomId}`).then(async res => {
        //   // nullify();
        //   // closeAll();
        //   // close();
        //   // await router.push("/");
        //   // queryClient.invalidateQueries(["user"]);
        //   // queryClient.removeQueries(["room"]);
        //   // queryClient.removeQueries(["room-status"]);
        //   // queryClient.removeQueries(["room-chat"]);
        // });
      }
    } catch (error) {
      console.log(error);
      router.push("/");
    }
  };

  const hasUnreadMessages = (cm: any) => {
    if (!cm) {
      return;
    }

    return cm.messages?.some((msg: ChatMessage) => !msg.read);
  };

  const markAllAsRead = () => {
    queryClient.setQueryData(["room-chat", roomId], (data: any) => {
      if (data) {
        const readChat = data?.messages.map((m: ChatMessage) => ({
          ...m,
          read: true,
        }));
        return { messages: readChat };
      }
      return data;
    });
  };

  useEffect(() => {
    if (chatOpen) {
      markAllAsRead();
    }
  }, [chatMessages]);

  return myDevice == "isDesktop" || myDevice == "isBigScreen" ? (
    <div className="bg-app_bg_deep w-full rounded-b-lg flex items-center justify-between p-3">
      <div className="space-x-1.5 flex items-center">
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
        <AppDialog content={<RoomShare room={room} />}>
          <Button className="bg-app_bg_deeper shadow-app_shadow">
            <UserPlus size={16} />
          </Button>
        </AppDialog>
        {/* <Button className="bg-app_bg_deeper">
          <MessageSquare size={16} />
        </Button> */}
      </div>
      <div>
        <Button
          onClick={handleLeave}
          className="w-28 bg-app_bg_deeper shadow-app_shadow"
        >
          {room!.creatorId == user.userId ? "End" : "Leave ✌"}
        </Button>
      </div>
    </div>
  ) : (
    <div className="w-full rounded-b-lg flex items-center justify-between p-3">
      <div className="space-x-1.5 flex items-center">
        {(myRoomStatus.isSpeaker || room.handRaiseEnabled) && (
          <Button
            onClick={myRoomStatus.isSpeaker ? handleMute : handleHandRaise}
            className={`${
              myRoomStatus!.isMuted || myRoomStatus!.raisedHand
                ? "bg-app_bg_deeper"
                : "bg-app_cta "
            } shadow-app_shadow `}
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

        <Sheet>
          <SheetTrigger asChild>
            <Button className="bg-app_bg_deeper shadow-app_shadow">
              <UserPlus size={16} />
            </Button>
          </SheetTrigger>
          <SheetContent
            position={myDevice !== "isMobile" ? "right" : "bottom"}
            size={myDevice !== "isMobile" ? "sm" : "content"}
          >
            <SheetHeader></SheetHeader>
            <RoomShare room={room} />
          </SheetContent>
        </Sheet>

        <Sheet open={chatOpen} onOpenChange={setChatOpen}>
          <SheetTrigger asChild>
            <Button
              onClick={() => markAllAsRead()}
              className="bg-app_bg_deeper shadow-app_shadow relative"
            >
              <MessageSquare size={16} />
              {hasUnreadMessages(chatMessages) && (
                <div className="w-2 h-2 rounded-full bg-yellow-100 absolute right-0.5 top-0"></div>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent
            className="h-4/5"
            position={myDevice !== "isMobile" ? "right" : "bottom"}
            size={myDevice !== "isMobile" ? "sm" : "content"}
          >
            <SheetHeader></SheetHeader>
            <RoomChatArea
              chatMessages={chatMessages!}
              chatOpen={true}
              conn={conn}
              room={room!}
              user={user}
            />
          </SheetContent>
        </Sheet>
        {/* <Button className="bg-app_bg_deeper">
          <MessageSquare size={16} />
        </Button> */}
      </div>
      <div>
        <Button
          onClick={handleLeave}
          className="bg-app_bg_deeper shadow-app_shadow"
        >
          {room!.creatorId == user.userId ? <PhoneMissed size={16} /> : "✌"}
        </Button>
      </div>
    </div>
  );
  // <div className="w-full h-16 flex flex-row items-center justify-center text-lg bg-zinc-700 bg-opacity-50 border-t-[1px] text-white p-3">
  //   <div className="flex flex-row items-center w-4/5  justify-around ">
  //     <button
  //       onClick={() => setLeave(true)}
  //       className="flex flex-col space-y-1 px-2 py-1 rounded-md items-center cursor-pointer active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
  //     >
  //       <BsTelephoneX fontSize={"1.2rem"} />
  //       <span className="text-xs">Leave</span>
  //     </button>

  //     {myRoomStatus.isSpeaker ? (
  //       <button
  //         onClick={handleMute}
  //         className="flex flex-col space-y-1 items-center px-2 py-1 rounded-md  cursor-pointer active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
  //       >
  //         {!myRoomStatus?.isMuted ? (
  //           <BsMic fontSize={"1.2rem"} />
  //         ) : (
  //           <BsMicMute fontSize={"1.2rem"} />
  //         )}
  //         <span className="text-xs">
  //           {!myRoomStatus?.isMuted ? "Mute" : "Unmute"}
  //         </span>
  //       </button>
  //     ) : (
  //       handRaiseEnabled && (
  //         <button
  //           onClick={handleHandRaise}
  //           className="flex flex-col space-y-1 items-center px-2 py-1 rounded-md  cursor-pointer active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
  //         >
  //           {!myRoomStatus?.raisedHand ? (
  //             <MdOutlineWavingHand fontSize={"1.2rem"} />
  //           ) : (
  //             <TbHandOff fontSize={"1.2rem"} />
  //           )}
  //           <span className="text-xs">
  //             {!myRoomStatus?.raisedHand ? "Raise" : "Unraise"}
  //           </span>
  //         </button>
  //       )
  //     )}

  //     {chatEnabled && (
  //       <button
  //         onClick={() => setChat(!chatOpen)}
  //         className="flex flex-col space-y-1 items-center cursor-pointer px-2 py-1 rounded-md active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
  //       >
  //         <BsChatLeft fontSize={"1.2rem"} />
  //         <span className="text-xs">Chat</span>
  //       </button>
  //     )}
  //     <button
  //       onClick={() => setInvite(true)}
  //       className="flex flex-col space-y-1 items-center cursor-pointer px-2 py-1 rounded-md active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300 "
  //     >
  //       <BsPersonPlus />
  //       <span className="text-xs">Invite</span>
  //     </button>

  //     {myRoomStatus.isMod && (
  //       <button
  //         onClick={() => setSettings(true)}
  //         className="flex flex-col space-y-1 px-2 py-1 rounded-md items-center cursor-pointer active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
  //       >
  //         <BsGear fontSize={"1.2rem"} />
  //         <span className="text-xs">Settings</span>
  //       </button>
  //     )}
  //   </div>
  // </div>
};

export default RoomControls;
