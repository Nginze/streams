import React, { useEffect } from "react";
import { useQueryClient } from "react-query";
import Avatar from "../../components/Avatar";
import { useVoiceStore } from "../webrtc/store/useVoiceStore";

const useSplitUsersIntoSections = (room: any) => {
  const speakers: React.ReactNode[] = [];
  const listeners: React.ReactNode[] = [];
  const askedToSpeak: React.ReactNode[] = [];

  if (!room) {
    return { listeners, askedToSpeak, speakers };
  }

  room.participants.forEach((u: any) => {
    let arr = listeners;
    if (u.userid === room.creatorId || u.isspeaker) {
      arr = speakers;
    } else if (u.askedtospeak) {
      arr = askedToSpeak;
    }

    arr.push(
      <Avatar
        imgUrl={u.avatarurl}
        isSpeaking={u.isspeaking}
        username={u.username}
        key={u.userid}
      />
    );
  });
  return { speakers, listeners, askedToSpeak };
};

export default useSplitUsersIntoSections;
