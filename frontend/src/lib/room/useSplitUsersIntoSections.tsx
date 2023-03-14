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
    if (u.userid === room.creatorid || u.isspeaker) {
      arr = speakers;
    } else if (u.askedToSpeak) {
      arr = askedToSpeak;
    }

    arr.push(
      <Avatar
        userid={u.userid}
        imgUrl={u.avatarurl}
        isspeaker={u.isspeaker}
        isSpeaking={u.isSpeaking}
        askedtospeak={u.askedtospeak}
        username={u.username}
        muted={u.muted}
        ismod={u.ismod}
        key={u.userid}
      />
    );
  });
  return { speakers, listeners, askedToSpeak };
};

export default useSplitUsersIntoSections;
