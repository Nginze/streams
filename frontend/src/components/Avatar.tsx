import { useEffect, useRef, useState } from "react";

type Props = {
  username: string;
  imgUrl: string;
  isSpeaking: boolean | undefined;
};

const Avatar = ({ username, imgUrl, isSpeaking }: Props) => {
  return (
    <>
        <div className="flex flex-col items-center mb-6">
          <img className="rounded-full w-16 h-16" src={imgUrl} />
          <span>
            <span className="text-sm font-semibold">
              {username}

              {isSpeaking && <span>🔊</span>}
            </span>
          </span>
        </div>
    </>
  );
};

export default Avatar;
