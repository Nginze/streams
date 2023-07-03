import React, { useContext } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { apiClient } from "../../lib/apiclient/client";
import { userContext } from "../../contexts/UserContext";
import { toast } from "react-hot-toast";
import { WebSocketContext } from "../../contexts/WebsocketContext";
import { BeatLoader } from "react-spinners";
import { useVoiceStore } from "@/lib/webrtc/store/useVoiceStore";
import { useConsumerStore } from "@/lib/webrtc/store/useConsumerStore";
import { useProducerStore } from "@/lib/webrtc/store/useProducerStore";

type Props = {
  participantId: String;
  room: Room;
  myRoomStatus: RoomStatus;
  toggleDialog: (value: boolean) => void;
};

const RoomParticipantProfile = ({
  participantId,
  myRoomStatus,
  room,
  toggleDialog,
}: Props) => {
  const { data: participant, isLoading: participantLoading } =
    useQuery<RoomParticipant>({
      queryKey: ["room-participant", participantId],
      queryFn: async () => {
        const { data } = await apiClient.get(`/profile/${participantId}`);
        return data;
      },
    });

  const {
    isLoading: roomBansLoading,
    data: roomBans,
    isRefetching,
  } = useQuery(["room-bans", room.roomId], async () => {
    const { data } = await apiClient.get(`/room/ban/${room.roomId}`);
    return data;
  });

  const { user } = useContext(userContext);
  const { conn } = useContext(WebSocketContext);
  const queryClient = useQueryClient();

  const { nullify } = useVoiceStore();
  const { closeAll } = useConsumerStore();
  const { close } = useProducerStore();

  const parseCamel = (snake: string) => {
    return snake.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
  };

  const followMutation = useMutation({
    mutationFn: async (params: {
      isAFollow: boolean;
      userToFollow?: String;
      userToUnFollow?: String;
    }) => {
      params.isAFollow
        ? await apiClient.post("/profile/follow", {
            userToFollow: params.userToFollow,
          })
        : await apiClient.delete(`/profile/unfollow/${params.userToUnFollow}`);
    },

    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries(["room-participant", participant!.userId]);
      variables.isAFollow
        ? toast(`Started following ${participant!.userName}\n`, {
            icon: "✔",
            style: {
              borderRadius: "10px",
              background: "#fff",
              color: "black",
            },
          })
        : toast(`Unfollowed ${participant!.userName}\n`, {
            icon: "✔",
            style: {
              borderRadius: "10px",
              background: "#fff",
              color: "black",
            },
          });
    },

    onError: () => {
      toast("Connection Failed. Try again", {
        icon: "❌",
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (params: {
      state: string;
      value: boolean;
      userId: string;
    }) => {
      await apiClient.put(
        `/room/room-status/update/${params.userId}?state=${params.state}&value=${params.value}&roomId=${room.roomId}`
      );
    },

    onMutate: async variables => {
      await queryClient.cancelQueries(["room-status", room.roomId]);

      const previousRoomStatus = queryClient.getQueryData([
        "room-status",
        room.roomId,
      ]);

      if (variables.userId === user.userId) {
        console.log("our own state updating room-status");
        console.log(variables.state, variables.value);
        queryClient.setQueryData(["room-status", room.roomId], (data: any) => ({
          ...data,
          [parseCamel(variables.state)]: variables.value,
        }));
      } else {
        console.log("not ours so updating room partiicpant");
        console.log(variables.state, variables.value);
        queryClient.setQueryData(
          ["room-participant", participantId],
          (data: any) => ({
            ...data,
            [parseCamel(variables.state)]: variables.value,
          })
        );
      }

      return { previousRoomStatus };
    },

    onSuccess: () => {
      // queryClient.invalidateQueries(["room-participant", participantId]);
    },

    onError: (error, variables, context) => {
      if (variables.userId === user.userId) {
        queryClient.setQueryData(
          ["room-status", room.roomId],
          context!.previousRoomStatus
        );
      }
    },
  });

  const banMutation = useMutation({
    mutationFn: async (params: {
      isBan: boolean;
      banType: string;
      userId: string;
    }) => {
      console.log(params.isBan);

      !params.isBan
        ? await apiClient.post(
            `/room/ban/${room.roomId}?userId=${params.userId}&banType=${params.banType}`
          )
        : await apiClient.delete(
            `/room/unban/${room.roomId}?userId=${params.userId}&banType=${params.banType}`
          );
    },

    onMutate: variables => {
      conn?.emit("ban-list-change", {
        roomId: room.roomId,
        bannedUser: {
          avatarUrl: participant?.avatarUrl,
          displayName: participant?.displayName,
          userId: participant?.userId,
          userName: participant?.userName,
        },
        banType: variables.banType,
        isBan: variables.isBan,
      });
    },

    onSuccess: async (data, variables) => {
      if (variables.banType === "room_ban") {
        conn?.emit('kicked-from-room', {userId: participant?.userId, roomId: room.roomId})
      }
    },

    onError: (error, variables, context) => {},
  });

  const handleFollow = async (e: any) => {
    try {
      followMutation.mutate({
        isAFollow: true,
        userToFollow: participant!.userId,
      });

      conn?.emit("invalidate-participants", { roomId: room.roomId });
    } catch (error) {}
  };

  const handleUnfollow = async () => {
    try {
      followMutation.mutate({
        isAFollow: false,
        userToUnFollow: participant!.userId,
      });
    } catch (error) {}
  };

  const handleAddSpeaker = async () => {
    try {
      conn?.emit("add-speaker", {
        roomId: room.roomId,
        userId: participant!.userId,
      });

      // toggleDialog(false);

      statusMutation.mutate({
        state: "is_speaker",
        userId: participant!.userId,
        value: true,
      });
    } catch (error) {}
  };

  const handleRemoveSpeaker = async () => {
    try {
      conn?.emit("remove-speaker", {
        roomId: room.roomId,
        userId: participant!.userId,
      });

      // toggleDialog(false);

      statusMutation.mutate({
        state: "is_speaker",
        userId: participant!.userId,
        value: false,
      });

      statusMutation.mutate({
        state: "is_muted",
        userId: participant!.userId,
        value: true,
      });
    } catch (error) {}
  };

  const handlePromoteToMod = async () => {
    try {
      conn?.emit("mod-added", {
        roomId: room.roomId,
        userId: participant!.userId,
      });

      // toggleDialog(false);

      statusMutation.mutate({
        state: "is_mod",
        userId: participant!.userId,
        value: true,
      });
    } catch (error) {}
  };

  const handleDemoteToListener = async () => {
    try {
      conn?.emit("mod-removed", {
        roomId: room.roomId,
        userId: participant!.userId,
      });

      // toggleDialog(false);

      statusMutation.mutate({
        state: "is_mod",
        userId: participant!.userId,
        value: false,
      });
    } catch (error) {}
  };

  const handleChatBan = async () => {
    try {
      banMutation.mutate({
        isBan: checkIsBanned(participant!.userId),
        banType: "chat_ban",
        userId: participant!.userId,
      });
    } catch (error) {}
  };

  const handleKickFromRoom = async () => {
    try {
      banMutation.mutate({
        isBan: false,
        banType: "room_ban",
        userId: participant!.userId,
      });
    } catch (error) {}
  };

  const checkIsBanned = (userId: string) => {
    return roomBans.some((ban: any) => ban.userId === userId);
  };

  return myRoomStatus && participant ? (
    <>
      <div className="mt-5">
        <div>
          <div className="flex items-center space-x-3">
            <img
              className="inline-block h-14 w-14 rounded-2xl active:opacity-80"
              src={participant.avatarUrl}
              alt=""
            />

            {/* {user.userId !== participant.userId &&
              (!followMutation.isLoading ? (
                <button
                  onClick={
                    !participant.followsMe ? handleFollow : handleUnfollow
                  }
                  className={`${
                    !participant.followsMe
                      ? "bg-gray-600"
                      : "ring ring-gray-600"
                  } px-2 py-1 flex items-center justify-center rounded-md w-1/4 active:bg-gray-800 focus:outline-none focus:ring focus:ring-gray-300`}
                >
                  {!participant.followsMe ? "Follow" : "Unfollow"}
                </button>
              ) : (
                <span>...</span>
              ))} */}
          </div>
          <div className="flex flex-col items-start space-y-3 mt-2  text-sm">
            <div className="flex flex-col items-start">
              {/* <span>{participant.userName}</span> */}
              <span className="text-md font-semibold text-[16px]">
                @{participant.userName}
              </span>
            </div>
            <div className="w-2/3 flex justify-between">
              <span className="font-semibold text-[16px]">
                {participant.followers} followers
              </span>
              <span className="font-semibold text-[16px]">
                {participant.following} following
              </span>
            </div>
            <span className="font-semibold text-[16px]">{participant.bio}</span>
          </div>
        </div>
      </div>
      {(myRoomStatus.isMod || room.creatorId === user.userId) &&
        participant.userId !== user.userId && (
          <div className="space-y-2 font-normal">
            <button
              onClick={
                participant.isMod ? handleDemoteToListener : handlePromoteToMod
              }
              className="bg-app_bg_deep p-4 font-semibold flex items-center justify-center  rounded-md w-full active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
            >
              {participant.isMod ? "Demote from Mod" : "Promote to Mod"}
            </button>

            <button
              onClick={
                participant.isSpeaker ? handleRemoveSpeaker : handleAddSpeaker
              }
              className="bg-app_bg_deep p-4 flex font-semibold items-center justify-center rounded-md w-full active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
            >
              {participant.isSpeaker ? "Move to Listener" : "Move to Speaker"}
            </button>
            <button
              onClick={handleChatBan}
              className="bg-app_bg_deep p-4 font-semibold flex items-center justify-center  rounded-md w-full active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
            >
              {!checkIsBanned(participant.userId)
                ? "Ban from Chat"
                : "Unban from Chat"}
            </button>
            <button
              onClick={handleKickFromRoom}
              className="bg-red-500 p-4 font-semibold flex items-center justify-center  rounded-md w-full active:bg-red-800 focus:outline-none focus:ring focus:ring-red-300"
            >
              Ban from Room
            </button>
          </div>
        )}
    </>
  ) : (
    <>Loading...</>
  );
};

export default RoomParticipantProfile;
