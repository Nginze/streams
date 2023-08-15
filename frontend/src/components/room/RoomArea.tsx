import React, { useContext } from "react";
import { Button } from "../ui/button";
import {
  MessageSquare,
  Mic,
  MicOff,
  Network,
  Settings,
  SignalHigh,
  UserPlus,
  Wifi,
} from "lucide-react";
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
import useSplitUsersIntoSections from "@/hooks/useSplitUsersIntoSections";
import useLoadRoomMeta from "@/hooks/useLoadRoomMeta";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Separator } from "../ui/separator";
import { useRTCStore } from "@/engine/webrtc/store/useRTCStore";
import RoomFooter from "./RoomFooter";
import useScreenType from "@/hooks/useScreenType";
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "../ui/sheet";

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
  } = useLoadRoomMeta(roomId as string, user, true);

  const { rtcStatus } = useRTCStore();

  const myDevice = useScreenType();

  const { askedToSpeak, listeners, speakers } = useSplitUsersIntoSections(
    room as Room
  );

  const host = (room as Room)?.participants.filter(
    p => p.userId == (room as Room)?.creatorId
  );

  return myDevice == "isDesktop" ? (
    <>
      <div className="grid grid-cols-3 gap-10">
        <div className="bg-app_bg_deeper col-span-2 rounded-lg flex flex-col h-[570px] shadow-app_shadow">
          <Accordion type="single" collapsible className="w-full px-5 py-0">
            <AccordionItem value="item-1" className="w-full">
              <AccordionTrigger className="w-full">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start w-ful">
                    <div className="flex justify-center items-center w-full">
                      <span className="font-semibold opacity-90 text-lg leading-7 flex-1 text-left">
                        {(room as Room)?.roomDesc}
                      </span>

                      {/* {(roomStatus!.isMod || room!.creatorId == user.userId) && (
                      <AppDialog content={<RoomSettings room={room!} />}>
                        <Button className="p-1.5 h-7 bg-app_bg_light">
                          <Settings size={16} />
                        </Button>
                      </AppDialog>
                    )} */}
                    </div>
                    <div className="text-sm opacity-90">
                      with <span className="font-semibold">Nginze</span>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="w-full">
                <div className="w-full flex items-center justify-between">
                  <div>
                    <div className="text-[12px]">Status</div>
                    <div className="font-semibold flex items-center space-x-2">
                      {rtcStatus === "connecting" ? (
                        <span className="text-amber-100">RTC connecting</span>
                      ) : rtcStatus == "connected" ? (
                        <span className="text-green-300">Voice connected</span>
                      ) : (
                        <span className="text-red-100">RTC Failed</span>
                      )}
                    </div>
                  </div>
                  <div>
                    {(roomStatus!.isMod ||
                      (room as Room)?.creatorId == user.userId) && (
                      <AppDialog content={<RoomSettings room={room as Room} />}>
                        <Button className="p-1.5 h-7 bg-app_bg_light shadow-app_shadow">
                          <Settings size={16} />
                        </Button>
                      </AppDialog>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Separator className="bg-app_bg_light " />
          <div className=" h-[450px] p-5 flex-auto overflow-auto sheet">
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
                  (roomStatus.isMod ||
                    (room as Room)?.creatorId == user.userId) && (
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
            room={room as Room}
            roomId={(room as Room).roomId}
            user={user}
          />
        </div>
        <div className="bg-app_bg_deeper rounded-lg">
          <RoomChatArea
            chatMessages={chatMessages!}
            chatOpen={true}
            conn={conn}
            room={room as Room}
            user={user}
          />
        </div>
      </div>
    </>
  ) : (
    <>
      <div>
        <div
          className="rounded-lg flex flex-col justify-end items-center"
          style={{ height: "calc(100vh - 6rem)" }}
        >
          <Accordion type="single" collapsible className="w-full px-5 py-0">
            <AccordionItem value="item-1" className="w-full">
              <AccordionTrigger className="w-full">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start w-ful">
                    <div className="flex justify-center items-center w-full">
                      <span className="font-semibold opacity-90 text-lg leading-7 flex-1 text-left">
                        {(room as Room)?.roomDesc}
                      </span>

                      {/* {(roomStatus!.isMod || room!.creatorId == user.userId) && (
                      <AppDialog content={<RoomSettings room={room!} />}>
                        <Button className="p-1.5 h-7 bg-app_bg_light">
                          <Settings size={16} />
                        </Button>
                      </AppDialog>
                    )} */}
                    </div>
                    <div className="text-sm opacity-90">
                      with <span className="font-semibold">Nginze</span>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="w-full">
                <div className="w-full flex items-center justify-between">
                  <div>
                    <div className="text-[12px]">Status</div>
                    <div className="font-semibold flex items-center space-x-2">
                      {rtcStatus === "connecting" ? (
                        <span className="text-amber-100">RTC connecting</span>
                      ) : rtcStatus == "connected" ? (
                        <span className="text-green-300">Voice connected</span>
                      ) : (
                        <span className="text-red-100">RTC Failed</span>
                      )}
                    </div>
                  </div>
                  <div>
                    {(roomStatus!.isMod ||
                      (room as Room)?.creatorId == user.userId) && (
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button className="p-1.5 h-7 bg-app_bg_light shadow-app_shadow">
                            <Settings size={16} />
                          </Button>
                        </SheetTrigger>
                        <SheetContent
                          position={
                            myDevice !== "isMobile" ? "right" : "bottom"
                          }
                          size={myDevice !== "isMobile" ? "sm" : "content"}
                        >
                          <SheetHeader></SheetHeader>
                          <RoomSettings room={room as Room} />
                        </SheetContent>
                      </Sheet>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Separator className="bg-app_bg_light w-5/6 opacity-30" />
          <div className=" h-[450px] p-5 flex-auto overflow-auto w-full">
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
                  (roomStatus.isMod ||
                    (room as Room)?.creatorId == user.userId) && (
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
            room={room as Room}
            roomId={(room as Room).roomId}
            user={user}
          />
        </div>
        {/* <div className="bg-app_bg_deeper rounded-lg">
          <RoomChatArea
            chatMessages={chatMessages!}
            chatOpen={true}
            conn={conn}
            room={room!}
            user={user}
          />
        </div> */}
      </div>
    </>
  );
};

export default RoomArea;
