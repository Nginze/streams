import {
  Check,
  CheckCheck,
  Copy,
  LucideUserPlus,
  UserPlus,
} from "lucide-react";
import React, { useContext, useEffect, useState } from "react";
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
import { useInviteStore } from "@/store/useInviteStore";

type Person = User & { online: boolean };
type ShareListItemProps = {
  person: Person;
  room: Room;
};

const ShareListItem = ({ person, room }: ShareListItemProps) => {
  const { conn } = useContext(WebSocketContext);
  const { user } = useContext(userContext);

  const { inviteLog, updateLastInvite } = useInviteStore();
  const [cooldownActive, setCooldownActive] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    const lastInvitedTimestamp = inviteLog?.get(person.userId);

    if (lastInvitedTimestamp) {
      const currentTime = Math.floor(Date.now() / 1000);
      const cooldownDuration = 5 * 60; // 5 minutes in seconds
      const timePassed = currentTime - lastInvitedTimestamp;

      if (timePassed < cooldownDuration) {
        setCooldownActive(true);
        setRemainingTime(cooldownDuration - timePassed);
      }
    }
  }, [inviteLog, person.userId]);

  useEffect(() => {
    let countdownInterval: any;

    if (cooldownActive && remainingTime > 0) {
      countdownInterval = setInterval(() => {
        setRemainingTime(prevTime => prevTime - 1);
      }, 1000);
    } else if (cooldownActive && remainingTime === 0) {
      setCooldownActive(false);
    }

    return () => clearInterval(countdownInterval);
  }, [cooldownActive, remainingTime]);

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
        {cooldownActive ? (
          <p className="text-sm opacity-70">{Math.floor(remainingTime / 60)}:{remainingTime % 60}</p>
        ) : (
          <Button
            onClick={() => {
              console.log("inviting...");
              conn?.emit("action:invite", { room, user, to: person.userId });
              updateLastInvite(person.userId)
              // set(person.userId, Math.floor(Date.now() / 1000)); // Update inviteLog with current timestamp
              setCooldownActive(true); // Start cooldown
              setRemainingTime(5 * 60); // Reset remaining time
            }}
            className={`bg-app_cta p-3 h-10 ${cooldownActive ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={cooldownActive}
          >
            <FaUserPlus size={18} />
          </Button>
        )}
      </div>
    </div>
  );
};
// const ShareListItem = ({ person, room }: ShareListItemProps) => {
//   const { conn } = useContext(WebSocketContext);
//   const { user } = useContext(userContext);

//   const { inviteLog, set } = useInviteStore();
//   return (
//     <div className="flex items-center justify-between space-x-4 cursor-pointer">
//       <div className="flex items-center space-x-4">
//         <div>
//           <img
//             className="w-[38px] h-[38px] rounded-full object-cover"
//             src={person?.avatarUrl}
//           />
//         </div>
//         <div className="flex flex-col item-start ">
//           <span className="text-lg font-semibold leading-tight">
//             {person?.userName}
//           </span>
//           <span className="text-sm leading-tight">online</span>
//         </div>
//       </div>
//       <div>
//         {
//           <Button
//             onClick={() => {
//               console.log("inviting...");
//               conn?.emit("action:invite", { room, user, to: person.userId });
//             }}
//             className="bg-app_cta p-3 h-10"
//           >
//             <FaUserPlus size={18} />
//           </Button>
//         }
//       </div>
//     </div>
//   );
// };

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
      const { data } = await api.get("/user/invite/online");
      return data;
    },
  });

  const roomUrl = `${window.location.origin}/room/${room.roomId}`;

  const handleCopy = async (link: string) => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
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
        onClick={() => handleCopy(roomUrl)}
        className="w-full"
      >
        <div className="flex items-center justify-center shadow-app_shadow outline-none border-none bg-app_bg_deep w-full p-3.5 rounded-sm text-center cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500">
          <span className="truncate flex-1">{roomUrl}</span>
          {!copied ? (
            <Copy
              size="16"
              className="ml-5 copy-icon opacity-0 group-hover:opacity-100 flex-shrink-0"
            />
          ) : (
            <CheckCheck size={"16"} className="ml-5 text-green-400 flex-shrink-0" />
          )}
        </div>
      </div>
      {people?.length > 0 && (
        <div className="flex flex-col items-start">
          <span className="font-semibold text-lg">People</span>
          <span className="text-sm opacity-70">
            You can only send an invite every 5 minutes
          </span>
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
