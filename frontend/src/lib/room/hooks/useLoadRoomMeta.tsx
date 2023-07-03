import { useQuery } from "react-query";
import { apiClient } from "../../apiclient/client";

const useLoadRoomMeta = (roomId: string, user: User) => {
  const { isLoading: chatLoading, data: chatMessages } = useQuery<
    ChatMessage[] | undefined
  >(["room-chat", roomId], {
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  const { isLoading: roomLoading, data: room } = useQuery<Room | string>(
    ["room", roomId],
    async () => {
      const { data } = await apiClient.get(
        `/room/${roomId}?userId=${user.userId}`
      );
      return data;
    },
    { enabled: !!user && !!roomId, refetchOnWindowFocus: false, staleTime: 0 }
  );

  const { isLoading: roomStatusLoading, data: roomStatus } =
    useQuery<RoomStatus>(
      ["room-status", roomId],
      async () => {
        const { data } = await apiClient.get(
          `/room/room-status/${roomId}/${user.userId}`
        );
        return data;
      },
      { enabled: !!room, refetchOnWindowFocus: false, refetchInterval: false }
    );

  const { isLoading: roomBansLoading, data: roomBans } = useQuery(
    ["room-bans", roomId],
    async () => {
      const { data } = await apiClient.get(`/room/ban/${roomId}`);
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
