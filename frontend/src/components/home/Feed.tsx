import React, { useContext, useState } from "react";
import {
  Archive,
  CalendarClock,
  Gavel,
  Globe,
  Plug,
  Plug2,
  Plus,
  PlusCircle,
  PlusIcon,
  RefreshCwIcon,
  Sparkle,
} from "lucide-react";
import { Button } from "../ui/button";
import Dialog from "../global/Dialog";
import CreateRoom from "./CreateRoom";
import AppDialog from "../global/AppDialog";
import { Skeleton } from "../ui/skeleton";
import { useQuery, useQueryClient } from "react-query";
import { useRouter } from "next/router";
import { WebSocketContext } from "@/contexts/WebsocketContext";
import { Socket } from "socket.io-client";
import { BiGlobe, BiPlug } from "react-icons/bi";
import {
  BsGlobeAmericas,
  BsGlobeCentralSouthAsia,
  BsSoundwave,
} from "react-icons/bs";
import { VscDebugDisconnect } from "react-icons/vsc";
import { api } from "@/api";
import { Toggle } from "@radix-ui/react-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Tooltip } from "@radix-ui/react-tooltip";
import { AiFillApi } from "react-icons/ai";
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "../ui/sheet";
import useScreenType from "@/hooks/useScreenType";

type FeedCardProps = {
  room: RoomCard;
};

type FeedProps = {
  conn: Socket;
};

type Tabs = "for-you" | "scheduled";

const Feed = ({ conn }: FeedProps) => {
  const queryClient = useQueryClient();
  const myDevice = useScreenType();

  const [currentTab, setCurrentTab] = useState<Tabs>("for-you");
  const { data: liveRooms, isLoading: liveRoomsLoading } = useQuery({
    queryKey: ["live-rooms"],
    queryFn: async () => {
      const { data } = await api.get("/room/rooms/live");
      return data;
    },
  });

  return (
    <>
      <div className="space-y-6 h-auto pb-5">
        <div className="flex items-center justify-between space-x-2">
          {myDevice == "isMobile" ? (
            <Sheet>
              <SheetTrigger asChild>
                <div className="flex space-x-2 items-baseline">
                  <Button
                    size={"sm"}
                    className="bg-green-800 rounded-sm shadow-app_shadow"
                  >
                    <PlusIcon size={20} className="text-green-400" />
                  </Button>
                  {/* <span className="text-[12px]">Start Room</span> */}
                </div>
              </SheetTrigger>
              <SheetContent
                position={myDevice !== "isMobile" ? "right" : "bottom"}
                size={myDevice !== "isMobile" ? "sm" : "content"}
              >
                <SheetHeader></SheetHeader>
                <CreateRoom conn={conn!} />
              </SheetContent>
            </Sheet>
          ) : (
            <div></div>
          )}
          <div>
            <div className="space-x-2 flex items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      style={{
                        background:
                          currentTab == "for-you" ? "white" : "#36393e",
                      }}
                      size={"sm"}
                      onClick={() => setCurrentTab("for-you")}
                      className="rounded-sm shadow-app_shadow"
                    >
                      <Sparkle
                        size={20}
                        color={currentTab == "for-you" ? "black" : "white"}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>For you</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      style={{
                        background:
                          currentTab == "scheduled" ? "white" : "#36393e",
                      }}
                      onClick={() => setCurrentTab("scheduled")}
                      size={"sm"}
                      className="shadow-app_shadow rounded-sm"
                    >
                      <CalendarClock
                        size={20}
                        color={currentTab == "scheduled" ? "black" : "white"}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Scheduled</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        {currentTab == "for-you" ? (
          <div className="space-y-4 overflow-auto ">
            {liveRoomsLoading
              ? Array.from({ length: 4 }, (_, index) => (
                  <FeedCardSkeleton key={index} />
                ))
              : liveRooms.map((room: RoomCard, index: any) => (
                  <FeedCard key={index} room={room} />
                ))}

            {(!liveRoomsLoading && !liveRooms) ||
              (liveRooms?.length == 0 && (
                <div className="text-center font-semibold mt-14 ">
                  <div className="flex flex-col items-center space-y-3">
                    <RefreshCwIcon color="white" size={50} />
                    <div className="text-white">No active rooms available</div>
                    <Button
                      onClick={() => {
                        queryClient.resetQueries(["live-rooms"]);
                      }}
                      className="w-[250px] bg-app_bg_deeper p-3 h-12 font-bold shadow-app_shadow"
                    >
                      Reload Feed
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <>
            <div className="text-center font-semibold mt-14 ">
              <div className="flex flex-col items-center space-y-3">
                <Gavel color="white" size={50} />
                <span>Scheduled rooms coming soon</span>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

const Chip = ({ content }: { content: string }) => {
  return (
    <div className="w-30 max-w-30 h-auto rounded-sm bg-app_bg_deepest text-sm py-1 px-2 inline-block truncate">
      {content}
      {/* <span className="w-full text-sm">{content}</span> */}
    </div>
  );
};

const FeedCard = ({ room }: FeedCardProps) => {
  const router = useRouter();
  return (
    <div
      onClick={() => {
        router.push(`/room/${room.roomId}`);
      }}
      className="shadow-app_shadow flex flex-col items-start bg-app_bg_deeper h-auto rounded-xl cursor-pointer"
    >
      <div className="p-5 space-y-3">
        <div>
          <span className="flex items-center">
            {!room.participants || room.participants.length == 0 ? (
              <AiFillApi className="mr-2" size={20} />
            ) : (
              <BsSoundwave className="mr-2" size={20} />
            )}
            {!room.participants || room.participants.length == 0
              ? "Ended"
              : "Live"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-start">
            <span className="font-medium text-lg">{room.roomDesc}</span>
            <span className="text-[12px]">
              <span>with </span>
              {room.creator}
            </span>
          </div>
          {/* <span className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-app_cta  rounded-full"></div>
          <span>{room.participants.length}</span>
        </span> */}
        </div>

        <div className="flex items-center">
          <div className="flex items-center mr-2">
            {room.participants?.slice(0, 3).map((rp, i) =>
              i == 0 ? (
                <Avatar
                  className="shadow-app_shadow object-cover"
                  style={{
                    width: "20px",
                    height: "20px",
                  }}
                >
                  <AvatarImage
                    className="shadow-app_shadow object-cover"
                    src={rp.avatarUrl}
                  />
                  <AvatarFallback className="bg-app_bg_light"></AvatarFallback>
                </Avatar>
              ) : (
                <Avatar
                  className="shadow-app_shadow object-cover"
                  style={{
                    width: "20px",
                    height: "20px",
                    marginLeft: "-0.3rem",
                  }}
                >
                  <AvatarImage
                    className="shadow-app_shadow object-cover"
                    src={rp.avatarUrl}
                  />
                  <AvatarFallback className="bg-app_bg_light"></AvatarFallback>
                </Avatar>
              )
            )}
          </div>
          {room.participants ? (
            <span className="text-sm">
              {room?.participants?.length} listening
            </span>
          ) : (
            "-"
          )}
        </div>
      </div>
      {/* <div className="w-full h-full bg-app_bg_deep rounded-b-xl space-y-2 py-2 px-5 flex items-center">
        <div className="flex items-center text-sm">
          <Avatar
            className="mr-2"
            style={{
              width: "20px",
              height: "20px",
              border: "2px solid white",
            }}
          >
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <span className="mr-2">Suguru Geto</span>
          <div className="bg-app_bg_deepest px-2 py-0.5 text-[12px] shadow-app_shadow rounded-xl bg-opacity-70">
            Host
          </div>
        </div>
        <div className="text-[12px] opacity-70">cs@ ashesi | loves anime</div>
      </div> */}

      {/* <div>{formatParticipantList(room.participants as any)}</div>
      <div className="w-full flex items-center space-x-3">
        {room.categories.map((category, index) => (
          <Chip key={index} content={category} />
        ))}
      </div> */}
    </div>
  );
};

const FeedCardSkeleton = () => {
  return (
    <Skeleton className="bg-app_bg_deep h-auto p-5 rounded-xl cursor-pointer space-y-6 shadow-app_shadow">
      <div className="space-x-2 flex items-center">
        <Skeleton className="w-5 bg-app_bg_light h-5 rounded-full" />
        <Skeleton className="w-1/12 bg-app_bg_light h-5" />
      </div>
      <div className="w-full flex items-center space-x-3">
        <Skeleton className="w-1/2 bg-app_bg_light h-5" />
      </div>
      <div className="flex items-center space-x-2">
        <Skeleton className="w-5 bg-app_bg_light h-5 rounded-full" />
        <Skeleton className="w-5 bg-app_bg_light h-5 rounded-full" />
        <Skeleton className="w-5 bg-app_bg_light h-5 rounded-full" />
      </div>
      {/* <div className="flex items-center space-x-2">
        <Skeleton className="w-5 bg-app_bg_light h-5 rounded-full" />
        <Skeleton className="w-1/5 bg-app_bg_light h-5" />
      </div> */}
    </Skeleton>
  );
};

function formatParticipantList(participants: String[]) {
  if (!participants || participants.length === 0) {
    return "";
  }

  const participantCount = participants.length;
  const MAX_DISPLAY_COUNT = 3;

  if (participantCount <= MAX_DISPLAY_COUNT) {
    return participants.join(", ");
  }

  const displayedNames = participants.slice(0, MAX_DISPLAY_COUNT);
  const remainingCount = participantCount - MAX_DISPLAY_COUNT;

  return `${displayedNames.join(", ")} & ${remainingCount} others`;
}

export default Feed;
