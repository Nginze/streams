import React, { useContext } from "react";
import { Button } from "../ui/button";
import { MessageSquare, Mic, MicOff, Settings, UserPlus } from "lucide-react";
import useSplitUsersIntoSections from "@/lib/room/hooks/useSplitUsersIntoSections";
import useLoadRoomMeta from "@/lib/room/hooks/useLoadRoomMeta";
import { useRouter } from "next/router";
import { userContext } from "@/contexts/UserContext";
import RoomChatArea from "./RoomChatArea";
import { WebSocketContext } from "@/contexts/WebsocketContext";
import AppDialog from "../global/AppDialog";
import RoomSettings from "./RoomSettings";
import RoomShare from "./RoomShare";
import { MdOutlineWavingHand } from "react-icons/md";
import { TbHandOff } from "react-icons/tb";
import RoomControls from "./RoomControls";

type Props = {};

const RoomArea = ({}: Props) => {
  const router = useRouter();
  const { id: roomId } = router.query;
  const { user } = useContext(userContext);
  const { conn } = useContext(WebSocketContext);

  const {
    chatLoading,
    roomLoading,
    roomStatusLoading,
    chatMessages,
    room,
    roomStatus,
  } = useLoadRoomMeta(roomId as string, user);

  const { askedToSpeak, listeners, speakers } = useSplitUsersIntoSections(
    room as Room
  );

  const host = room?.participants.filter(p => p.userId == room.creatorId);

  return (
    <div className="grid grid-cols-3 gap-10">
      <div className="bg-app_bg_deeper col-span-2 rounded-lg flex flex-col h-[570px]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-start p-5 w-full">
            <div className="flex justify-center items-center w-full">
              <span className="font-bold text-lg leading-7 flex-1">
                {room?.roomDesc}
              </span>

              {(roomStatus!.isMod || room!.creatorId == user.userId) && (
                <AppDialog content={<RoomSettings room={room!} />}>
                  <Button className="p-1.5 h-7 bg-app_bg_light">
                    <Settings size={16} />
                  </Button>
                </AppDialog>
              )}
            </div>
            <span className="text-sm">
              with <span className="font-bold">{room?.creatorId}</span>
            </span>
          </div>
        </div>
        <div className=" h-[450px] p-5 flex-auto overflow-auto">
          {roomStatus && room && (
            <>
              <div className="mb-9 w-full">
                <p className="mb-4 text-sm font-bold flex items-center">
                  Speakers
                  <span className="bg-app_bg_light ml-2 h-5 w-7 rounded-sm flex items-center justify-center text-xs">
                    {speakers.length}
                  </span>
                </p>
                <div className="grid grid-cols-4 gap-2">{speakers}</div>
              </div>

              {askedToSpeak.length > 0 &&
                (roomStatus.isMod || room.creatorId == user.userId) && (
                  <div className="mb-6 w-full">
                    <p className="mb-4 text-sm font-bold flex items-center">
                      Requesting to speak
                      <span className="bg-app_bg_light ml-2 h-5 w-7 rounded-sm flex items-center justify-center text-xs">
                        {askedToSpeak.length}
                      </span>
                    </p>
                    <div className="grid grid-cols-4 gap-x-2">
                      {askedToSpeak}
                    </div>
                  </div>
                )}

              <div className="mb-6 w-full">
                <p className="mb-4 text-sm font-bold flex items-center">
                  Listeners
                  <span className="bg-app_bg_light ml-2 h-5 w-7 rounded-sm flex items-center justify-center text-xs">
                    {listeners.length}
                  </span>
                </p>
                <div className="grid grid-cols-4 gap-x-2">{listeners}</div>
              </div>
            </>
          )}
        </div>
        <RoomControls
          conn={conn}
          myRoomStatus={roomStatus!}
          room={room!}
          roomId={room!.roomId}
          user={user}
        />
      </div>
      <div className="bg-app_bg_deeper rounded-lg">
        <RoomChatArea
          chatMessages={chatMessages!}
          chatOpen={true}
          conn={conn}
          room={room!}
          user={user}
        />
      </div>
    </div>
  );
};

export default RoomArea;
