import { useRouter } from "next/router";
import { useContext, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { userContext } from "../contexts/UserContext";
import { WebSocketContext } from "../contexts/WebsocketContext";
import { useModalStore } from "../global-stores/useModalStore";
import { apiClient } from "../lib/apiclient/client";

type Props = {
  userid: string;
  username: string;
  imgUrl: string;
  isSpeaking: boolean | undefined;
  isspeaker: boolean;
  askedtospeak: boolean | undefined;
  muted: boolean | undefined;
  ismod: boolean;
};

const Avatar = ({
  userid,
  username,
  imgUrl,
  isSpeaking,
  isspeaker,
  askedtospeak,
  muted,
  ismod,
}: Props) => {
  const { setOptions, setUserId, setIsMod, setIsSpeaker } = useModalStore();
  const queryClient = useQueryClient();
  const { data: user, isLoading: userLoading } = useContext(userContext);
  const router = useRouter();
  const { id: roomId } = router.query;
  const roomPermissions: any = queryClient.getQueryData([
    "room-permissions",
    roomId,
  ]);
  return (
    <>
      <div
        onClick={() => {
          if (roomPermissions?.ismod && userid !== user.userid) {
            setUserId(userid);
            setIsMod(ismod);
            setIsSpeaker(isspeaker);
            setOptions(true);
          }
        }}
        className="relative cursor-pointer flex flex-col items-center mb-6"
      >
        <img className="rounded-full w-16 h-16" src={imgUrl} />
        <span>
          <span className="text-sm font-semibold">
            {ismod && <span>👑</span>}
            {user.userid === userid ? "You" : username}
            {askedtospeak && <span>🤚</span>}
            {isSpeaking && !muted && <span>🔊</span>}
            {muted && <span>🔇</span>}
          </span>
        </span>
      </div>
    </>
  );
};

export default Avatar;
