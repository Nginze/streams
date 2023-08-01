import React, { useContext } from "react";
import { Button } from "../ui/button";
import { useMutation, useQuery } from "react-query";
import { userContext } from "@/contexts/UserContext";
import { WebSocketContext } from "@/contexts/WebsocketContext";
import { useRouter } from "next/router";
import { api } from "@/api";

const RoomBanItem = ({ bannedUser }: { bannedUser: any }) => {
  const router = useRouter();
  const { conn } = useContext(WebSocketContext);
  const { id: roomId } = router.query;

  const banMutation = useMutation({
    mutationFn: async (params: {
      isBan: boolean;
      banType: string;
      userId: string;
    }) => {
      console.log(params.isBan);

      !params.isBan
        ? await api.post(
            `/room/ban/${roomId}?userId=${params.userId}&banType=${params.banType}`
          )
        : await api.delete(
            `/room/unban/${roomId}?userId=${params.userId}&banType=${params.banType}`
          );
    },

    onMutate: variables => {
      conn?.emit("ban-list-change", {
        roomId,
        bannedUser,
        banType: variables.banType,
        isBan: variables.isBan,
      });
    },

    onSuccess: (data, variables) => {},

    onError: (error, variables, context) => {},
  });

  const handleChatBan = async () => {
    console.log("bann loading..");
    try {
      banMutation.mutate({
        isBan: checkIsBanned(bannedUser!.userId),
        banType: "chat_ban",
        userId: bannedUser!.userId,
      });
    } catch (error) {}
  };

  const {
    isLoading: roomBansLoading,
    data: roomBans,
    isRefetching,
  } = useQuery(["room-bans", roomId], async () => {
    const { data } = await api.get(`/room/ban/${roomId}`);
    return data;
  });

  const checkIsBanned = (userId: string) => {
    return roomBans.some((ban: any) => ban.userId === userId);
  };

  return (
    <div className="flex items-center justify-between space-x-4 cursor-pointer">
      <div className="flex items-center space-x-4">
        <div>
          <img
            className="w-[38px] h-[38px] rounded-full object-cover"
            src={bannedUser?.avatarUrl}
          />
        </div>
        <div className="flex flex-col item-start ">
          <span className="text-lg font-semibold leading-tight">
            {bannedUser?.userName}
          </span>
        </div>
      </div>
      <div>
        <Button onClick={handleChatBan} className="bg-app_bg_deepest p-3 h-10">
          Unban
        </Button>
      </div>
    </div>
  );
};

const RoomBanList = ({ roomId }: { roomId: string }) => {
  const { isLoading: roomBansLoading, data: roomBans } = useQuery(
    ["room-bans", roomId],
    async () => {
      const { data } = await api.get(`/room/ban/${roomId}`);
      return data;
    }
  );

  return (
    <div className="space-y-4">
      {roomBans && roomBans.length > 0 && (
        <span className="font-bold text-lg">Banned Users</span>
      )}
      <div>
        {roomBans.map((rb: any, idx: number) => (
          <RoomBanItem key={idx} bannedUser={rb} />
        ))}
      </div>
    </div>
  );
};

export default RoomBanList;
