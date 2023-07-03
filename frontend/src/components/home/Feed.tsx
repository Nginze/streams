import React, { useContext } from "react";
import {
  Archive,
  Globe,
  Plug,
  Plug2,
  Plus,
  PlusCircle,
  RefreshCwIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import Dialog from "../global/Dialog";
import CreateRoom from "./CreateRoom";
import AppDialog from "../global/AppDialog";
import { Skeleton } from "../ui/skeleton";
import { useQuery, useQueryClient } from "react-query";
import { apiClient } from "@/lib/apiclient/client";
import { useRouter } from "next/router";
import { WebSocketContext } from "@/contexts/WebsocketContext";
import { Socket } from "socket.io-client";
import { BiGlobe, BiPlug } from "react-icons/bi";
import { BsGlobeAmericas, BsGlobeCentralSouthAsia } from "react-icons/bs";
import { VscDebugDisconnect } from "react-icons/vsc";

type FeedCardProps = {
  room: Room;
};

type FeedProps = {
  conn: Socket;
};

const Feed = ({ conn }: FeedProps) => {
  const queryClient = useQueryClient();
  const { data: liveRooms, isLoading: liveRoomsLoading } = useQuery({
    queryKey: ["live-rooms"],
    queryFn: async () => {
      const { data } = await apiClient.get("/room/rooms/live");
      return data;
    },
  });

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-end space-x-2">
          {/* <span className="text-xl flex items-center font-semibold ">
            <BsGlobeAmericas className="mr-2" color="#424549" />
            Live rooms
          </span> */}
          <AppDialog content={<CreateRoom conn={conn!} />}>
            <Button className="bg-app_cta focus:outline-none focus:ring focus:ring-app_cta rounded-sm">
              <PlusCircle className="mr-1 h-4 2-4" /> New Room
            </Button>
          </AppDialog>
        </div>
        <div className="space-y-4 overflow-auto ">
          {liveRoomsLoading
            ? Array.from({ length: 4 }, (_, index) => (
                <FeedCardSkeleton key={index} />
              ))
            : liveRooms.map((room: Room, index: any) => (
                <FeedCard key={index} room={room} />
              ))}

          {(!liveRoomsLoading && !liveRooms) ||
            (liveRooms?.length == 0 && (
              <div className="text-center font-semibold ml-52 w-1/4 mt-14 ">
                <div className="flex flex-col items-center space-y-3">
                  <RefreshCwIcon color="white" size={50} />
                  <div className="text-white">No active rooms available</div>
                  <Button
                    onClick={() => {
                      queryClient.resetQueries(["live-rooms"]);
                    }}
                    className="w-full bg-app_bg_deeper p-3 h-12 font-bold"
                  >
                    Reload Feed
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
};

const Chip = ({ content }: { content: string }) => {
  return (
    <div className="w-30 max-w-30 h-auto rounded-sm bg-app_bg_light text-sm py-1 px-2 inline-block truncate">
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
      className="bg-app_bg_deeper h-[142px] p-5 rounded-md cursor-pointer space-y-4 hover:bg-app_bg_deep active:bg-app_bg_light"
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-lg">{room.roomDesc}</span>
        <span className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-app_cta  rounded-full"></div>
          <span>{room.participants.length}</span>
        </span>
      </div>
      <div>{formatParticipantList(room.participants as any)}</div>
      <div className="w-full flex items-center space-x-3">
        {room.categories.map((category, index) => (
          <Chip key={index} content={category} />
        ))}
      </div>
    </div>
  );
};

const FeedCardSkeleton = () => {
  return (
    <Skeleton className="bg-app_bg_deep h-[142px] p-5 rounded-md cursor-pointer space-y-4 ">
      <div className="space-y-5">
        <Skeleton className="w-3/5 bg-app_bg_light h-5" />
        <Skeleton className="w-4/5 bg-app_bg_light h-5" />
      </div>
      <div className="w-full flex items-center space-x-3">
        <Skeleton className="w-1/3" />
      </div>
    </Skeleton>
  );
};

function formatParticipantList(participants: String[]) {
  if (!participants || participants.length === 0) {
    return "🔨 still in test mode. Hang on ";
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
