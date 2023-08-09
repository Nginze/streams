import { api } from "@/api";
import { useQuery } from "react-query";

const useLoadRoomMeta = (roomId: string, user: User, hasJoined: boolean = true) => {
  const { isLoading: chatLoading, data: chatMessages } = useQuery<
    ChatMessage[] | undefined
  >(["room-chat", roomId], {
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  const { isLoading: roomLoading, data: room } = useQuery<Room | string>(
    ["room", roomId],
    async () => {
      const { data } = await api.get(
        `/room/${roomId}?userId=${user.userId}${hasJoined ? "&hasJoined=true" : ""}`
      );
      return data;
    },
    { enabled: !!user && !!roomId, refetchOnWindowFocus: false  }
  );

  const { isLoading: roomStatusLoading, data: roomStatus } =
    useQuery<RoomStatus>(
      ["room-status", roomId],
      async () => {
        const { data } = await api.get(
          `/room/room-status/${roomId}/${user.userId}`
        );
        return data;
      },
      { enabled: !!room, refetchOnWindowFocus: false, refetchInterval: false }
    );

  const { isLoading: roomBansLoading, data: roomBans } = useQuery(
    ["room-bans", roomId],
    async () => {
      const { data } = await api.get(`/room/ban/${roomId}`);
      return data;
    }
  );

  return {
    chatLoading,
    roomLoading,
    roomStatusLoading,
    room,
    chatMessages,
    roomStatus,
  };
};

export default useLoadRoomMeta;
