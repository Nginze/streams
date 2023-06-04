import React, { useRef, useState } from "react";
import { MdOutlineEmojiEmotions } from "react-icons/md";
import { Socket } from "socket.io-client";
import { customEmojis, emoteMap } from "../../lib/room/chat/EmoteData";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { AiOutlineClose } from "react-icons/ai";
import { HiReply } from "react-icons/hi";

type Props = {
  conn: Socket | null;
  room: Room;
  user: User;
  chatMessages: ChatMessage[];
  chatOpen: boolean;
};

const RoomChatArea = ({ conn, room, chatMessages, chatOpen, user }: Props) => {
  const [chatContent, setMessage] = useState<string>("");
  const [showPicker, setPicker] = useState<boolean>(false);
  const [replyOn, setReplyOn] = useState<boolean>(false);

  const chatInputRef = useRef<HTMLInputElement>(null);

  const parseMessage = (msg: string) => {
    let tokens: any = msg.split(" ");
    let parsedMessage: (React.ReactNode | string)[] = [];
    tokens = tokens.map((t: any) => {
      const parsedToken = t.replaceAll(":", "");
      if (emoteMap[parsedToken] && t.indexOf(":") > -1) {
        parsedMessage?.push(
          <img className="inline" src={emoteMap[parsedToken]} />
        );
        parsedMessage.push(" ");
      } else {
        parsedMessage?.push(t);
        parsedMessage.push(" ");
      }
    });
    return parsedMessage;
  };

  const handleChatSend = (e: any) => {
    e.preventDefault();
    setPicker(false);
    const message: ChatMessage = {
      ...user,
      content: chatContent,
      createdAt: new Date(),
    };
    conn?.emit("new-chat-message", { roomId: room.roomId, message });
    setMessage("");
  };

  const addEmoji = (e: any) => {
    const emoji = e.native ? e.native : ` ${e.shortcodes} `;
    chatInputRef.current?.focus();
    setMessage(chatContent => chatContent + emoji);
  };

  return chatOpen && room.chatEnabled ? (
    <div className="w-72 min-w-72 h-full relative ">
      <div className="w-full h-16 text-white flex flex-row items-center justify-center text-lg bg-zinc-700 bg-opacity-50 border-b-[0.5px] p-3">
        <span className="text-left w-full">Chat</span>
      </div>
      <div
        className={`chat w-full max-h-4/5 ${"h-4/5"} px-4 py-4 bg-zinc-700 bg-opacity-50 overflow-y-auto overflow-x-hidden flex flex-col-reverse items-start`}
      >
        {/* <div className="w-64 cursor-pointer max-h-24 absolute text-sm bg-zinc-700 flex flex-col items-start text-white top-20 px-3 py-2 rounded-lg">
          <span>room description</span>
          <span className="opacity-50">{room.roomDesc}</span>
        </div> */}
        {chatMessages ? (
          (chatMessages as any).messages
            .slice()
            .reverse()
            .map((msg: ChatMessage) => (
              <div className="mb-2" key={msg.userId + msg.createdAt.toString()}>
                <span>
                  <img
                    className="inline rounded-full mr-2 w-4 h-4 object-cover "
                    src={msg.avatarUrl}
                  />
                </span>
                <span
                  style={{ color: "white" }}
                  className={`font-semibold mr-2 text-sm`}
                >
                  {msg.userName}:{" "}
                </span>
                <span className="text-white mb-3 max-w-full break-words text-sm">
                  {parseMessage(msg.content)}
                </span>
              </div>
            ))
        ) : (
          <span className="text-white text-sm">Welcome to Chat ✨</span>
        )}
      </div>
      {/* <div className="w-full h-auto text-white bg-zinc-700 text-sm px-3 pt-3  rounded-t-xl -mt-7"> <div className="flex items-center mb-2 bg-zinc-700">
          <span className="space-x-4 flex items-center bg-zinc-700">
            <HiReply fontSize={"1.2rem"} />
            <span>
              Replying to <span className="font-bold">@RagerX</span>
            </span>
          </span>
          <button
            onClick={() => {}}
            className="absolute right-5 cursor-pointer hover:bg-zinc-600 active:bg-zinc-700 p-1 rounded-md "
          >
            <AiOutlineClose fontSize={"1.2rem"} />
          </button>
        </div>
        <div>RagerX: i think Game of thrones is bad</div>
      </div> */}
      <div className="w-full h-16 relative  flex flex-col items-start justify-between text-lg bg-zinc-700  py-3 px-2">
        <form className="w-full text-white relative" onSubmit={handleChatSend}>
          <div className="absolute bottom-16 z-70 left-0">
            {showPicker && (
              <Picker
                data={data}
                custom={customEmojis}
                onEmojiSelect={addEmoji}
              />
            )}
          </div>
          <span className="absolute right-2 top-2 cursor-pointer hover:bg-zinc-600 active:bg-zinc-700 p-1 rounded-md ">
            <span
              onClick={() => {
                chatInputRef.current?.focus();
                setPicker(!showPicker);
              }}
            >
              <MdOutlineEmojiEmotions fontSize={"1.2rem"} />
            </span>
          </span>
          <div>
            <input
              value={chatContent}
              ref={chatInputRef}
              onChange={e => setMessage(e.target.value)}
              className="w-full p-2 py-3 text-sm bg-zinc-800 rounded-md"
              placeholder="Send a message"
            />
          </div>
        </form>
      </div>
    </div>
  ) : null;
};

export default RoomChatArea;
