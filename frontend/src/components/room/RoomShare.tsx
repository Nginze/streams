import { Copy, LucideUserPlus, UserPlus } from "lucide-react";
import React, { useContext } from "react";
import { Skeleton } from "../ui/skeleton";
import { apiClient } from "@/lib/apiclient/client";
import { useQuery } from "react-query";
import PeopleList from "../global/PeopleList";
import { Button } from "../ui/button";
import { TbUserPlus } from "react-icons/tb";
import { WebSocketContext } from "@/contexts/WebsocketContext";
import { userContext } from "@/contexts/UserContext";

type Person = User & { online: boolean };
type ShareListItemProps = {
  person: Person;
  room: Room;
};

const ShareListItem = ({ person, room }: ShareListItemProps) => {
  const { conn } = useContext(WebSocketContext);
  const { user } = useContext(userContext);
  return (
    <div className="flex items-center justify-between space-x-4 cursor-pointer">
      <div className="flex items-center space-x-4">
        <div>
          <img
            className="w-[38px] h-[38px] rounded-full object-cover"
            src={person?.avatarUrl}
          />
        </div>
        <div className="flex flex-col item-start ">
          <span className="text-lg font-semibold leading-tight">
            {person?.userName}
          </span>
          <span className="text-sm leading-tight">online</span>
        </div>
      </div>
      <div>
        <Button
          onClick={() => {
            console.log("inviting...");
            conn?.emit("room-invite", { room, user, to: person.userId });
          }}
          className="bg-app_cta p-4 h-10"
        >
          <LucideUserPlus size={18} />
        </Button>
      </div>
    </div>
  );
};

const ShareListItemSkeleton = () => {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full bg-app_bg_deep" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[150px] rounded-sm bg-app_bg_deep" />
        <Skeleton className="h-4 w-[100px] rounded-sm bg-app_bg_deep" />
      </div>
    </div>
  );
};

type RoomShareProps = {
  room: Room;
};

const RoomShare = ({ room }: RoomShareProps) => {
  const { isLoading: peopleLoading, data: people } = useQuery({
    queryKey: ["invites"],
    queryFn: async () => {
      const { data } = await apiClient.get("/profile/invite/online");
      return data;
    },
  });

  return (
    <div className="mt-4 space-y-4">
      <div>
        <span className="font-bold text-lg">Copy Room Link</span>
      </div>
      <div className="w-full">
        <div className=" flex justify-between items-center outline-none border-none bg-app_bg_light w-full p-3 rounded-sm text-center font-semibold text-sm cursor-pointer">
          http://drop.tv/room/alkajsdflkasl
          <Copy size={16} />
        </div>
      </div>
      {people?.length > 0 && (
        <div>
          <span className="font-bold text-lg">People</span>
        </div>
      )}
      <div className="chat space-y-4 h-auto max-h-[200px] overflow-auto ">
        {peopleLoading ? (
          <div className="space-y-4 pt-6">
            {Array.from({ length: 4 }, (_, index) => (
              <ShareListItemSkeleton key={index} />
            ))}
          </div>
        ) : (
          people.map((person: Person) => (
            <ShareListItem room={room} person={person} />
          ))
        )}
      </div>
    </div>
  );
};

export default RoomShare;
