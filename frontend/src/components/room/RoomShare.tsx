import { Check, CheckCheck, Copy, LucideUserPlus, UserPlus } from "lucide-react";
import React, { useContext, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { api } from "@/api";
import { useQuery } from "react-query";
import PeopleList from "../global/PeopleList";
import { Button } from "../ui/button";
import { TbUserPlus } from "react-icons/tb";
import { WebSocketContext } from "@/contexts/WebsocketContext";
import { userContext } from "@/contexts/UserContext";
import { FaUserPlus } from "react-icons/fa";
import { toast } from "react-hot-toast";

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
          className="bg-app_cta p-3 h-10"
        >
          <FaUserPlus size={18} />
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
  const [copied, setCopied] = useState(false);
  const { isLoading: peopleLoading, data: people } = useQuery({
    queryKey: ["invites"],
    queryFn: async () => {
      const { data } = await api.get("/profile/invite/online");
      return data;
    },
  });

  const handleCopy = async (link: string) => {
    await navigator.clipboard.writeText(link);
    setCopied(true)
    toast.success("Copied room link", {
      style: {
        borderRadius: "10px",
        background: "#333",
        color: "#fff",
      },
    });
  };

  return (
    <div className="mt-4 space-y-4">
      <div>
        <span className="font-semibold text-lg">Share with others 🤙</span>
      </div>
      <div
        onClick={() => handleCopy("http://drop.tv/room/alkajsdflkasl")}
        className="w-full"
      >
        <div className="flex items-center justify-center shadow-app_shadow outline-none border-none bg-app_bg_deep w-full p-3.5 rounded-sm text-center cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500">
          http://drop.tv/room/alkajsdflkasl
          {!copied ? (
            <Copy
              size="16"
              className="ml-5 copy-icon opacity-0 group-hover:opacity-100"
            />
          ) : (
            <CheckCheck size={"16"} className="ml-5 text-green-400" />
          )}
        </div>
      </div>
      {people?.length > 0 && (
        <div>
          <span className="font-semibold text-lg">People</span>
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
