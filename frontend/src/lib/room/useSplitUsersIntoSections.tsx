import React, { useContext } from "react";
import { HiOutlineHand } from "react-icons/hi";
import { useQuery, useQueryClient } from "react-query";
import Avatar from "../../components/Avatar";
import { userContext } from "../../contexts/UserContext";
import { apiClient } from "../apiclient/client";

const useSplitUsersIntoSections = (room: any) => {
  const speakers: React.ReactNode[] = [];
  const listeners: React.ReactNode[] = [];
  const askedToSpeak: React.ReactNode[] = [];
  const queryClient = useQueryClient();
  if (!room) {
    return { listeners, askedToSpeak, speakers };
  }

  const { data: user, isLoading: userLoading } = useContext(userContext);
  const roomPermissions: any = queryClient.getQueryData([
    "room-permissions",
    room.roomid,
  ]);
  room.participants.forEach((u: any) => {
    let arr = listeners;
    if (u.userid === room.creatorid || u.isspeaker) {
      arr = speakers;
    } else if (u.askedToSpeak) {
      arr = askedToSpeak;
    }

    arr.push(
      <Avatar
        userid={u.userid}
        avatarurl={u.avatarurl}
        bio={u.bio}
        isspeaker={u.isspeaker}
        active={u?.active}
        askedtospeak={u.askedtospeak}
        username={u.username}
        muted={u.muted}
        ismod={u.ismod}
        following={u.following}
        followers={u.followers}
        key={u.userid}
      />
    );
  });
  if ((roomPermissions && !roomPermissions.isspeaker ) && (user.userid != room.creatorid)) {
    speakers.push(
      <>
        <div className="cursor-pointer w-full h-16 flex flex-col items-center mb-6">
          <button
            style={{ width: "3.5rem", height: "3.5rem" }}
            className={`flex rounded-full ring-1 ring-white items-center mt-2 justify-center cursor-pointer bg-zinc-600 active:opacity-80 `}
          >
            <HiOutlineHand fontSize={"1.6rem"} />
          </button>
        </div>
      </>
    );
  }
  return { speakers, listeners, askedToSpeak };
};

export default useSplitUsersIntoSections;
