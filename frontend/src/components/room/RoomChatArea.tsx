import { useState, useRef } from "react";
import { MdOutlineEmojiEmotions } from "react-icons/md";
import { Socket } from "socket.io-client";
import { customEmojis, emoteMap } from "../../lib/room/chat/EmoteData";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { AiOutlineClose } from "react-icons/ai";
import { MentionsInput, Mention, SuggestionDataItem } from "react-mentions";
import { HiReply } from "react-icons/hi";

type Props = {
  conn: Socket | null;
  room: Room;
  user: User;
  chatMessages: ChatMessage[];
  chatOpen: boolean;
};

const convertToSuggestions = (rpList: RoomParticipant[]) => {
  return rpList.map(rp => ({ id: rp.userId, display: rp.userName }));
};

const RoomChatArea = ({ conn, room, chatMessages, chatOpen, user }: Props) => {
  const [chatContent, setMessage] = useState<string>("");
  const [showPicker, setPicker] = useState<boolean>(false);
  const [replyOn, setReplyOn] = useState<boolean>(false);
  const [reply, setReply] = useState<ChatMessage | undefined>();

  const chatInputRef = useRef<HTMLInputElement>(null);

  // const parseMessage = (msg: string) => {
  //   let tokens: any = msg.split(" ");
  //   let parsedMessage: (React.ReactNode | string)[] = [];
  //   tokens = tokens.map((t: any) => {
  //     const parsedToken = t.replaceAll(":", "");
  //     if (emoteMap[parsedToken] && t.indexOf(":") > -1) {
  //       parsedMessage?.push(
  //         <img className="inline" src={emoteMap[parsedToken]} />
  //       );
  //       parsedMessage.push(" ");
  //     } else {
  //       parsedMessage?.push(t);
  //       parsedMessage.push(" ");
  //     }
  //   });
  //   return parsedMessage;
  // };

  const parseMessage = (msg: string): React.ReactNode[] => {
    const tokens = msg.split(" ");
    const parsedMessage: (React.ReactNode | string)[] = [];

    tokens.forEach(t => {
      const parsedToken = t.replaceAll(":", "");

      if (emoteMap[parsedToken] && t.indexOf(":") > -1) {
        parsedMessage.push(
          <img
            className="inline"
            src={emoteMap[parsedToken]}
            alt={parsedToken}
          />
        );
        parsedMessage.push(" ");
      } else if (t.startsWith("http://") || t.startsWith("https://")) {
        parsedMessage.push(
          <a
            href={t}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500"
          >
            {t}
          </a>
        );
        parsedMessage.push(" ");
      } else if (t.startsWith("@")) {
        parsedMessage.push(
          <span className="bg-orange-400 p-1 rounded-sm text-xs">{t}</span>
        );
        parsedMessage.push(" ");
      } else {
        parsedMessage.push(t);
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
      reply,
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
    <div className="h-[570px] flex flex-col items-center">
      <div
        className={`chat w-full px-2  overflow-y-auto overflow-x-hidden flex  flex-col-reverse flex-1 items-start space-y-1`}
      >
        {chatMessages ? (
          (chatMessages as any).messages
            .slice()
            .reverse()
            .map((msg: ChatMessage) => (
              <div className="relative group w-full hover:bg-app_bg_deep cursor-pointer rounded-md px-2 ">
                <div
                  onClick={() => {
                    setReply(msg);
                  }}
                  className="hidden group-hover:block absolute right-0 -top-2 cursor-pointer bg-zinc-800 p-1 rounded-md shadow-lg hover:bg-zinc-700 z-50"
                >
                  <HiReply color="white" size={18} />
                </div>

                {msg.reply && (
                  <span className="text-sm text-gray-400 inline-block max-w-full w-full truncate">
                    Replying to @{msg.reply.userName}: {msg.reply.content}
                  </span>
                )}
                <div
                  className="relative"
                  key={msg.userId + msg.createdAt.toString()}
                >
                  <span>
                    <img
                      className="inline rounded-full mr-2 w-4 h-4 object-cover "
                      src={msg.avatarUrl}
                    />
                  </span>
                  <span
                    style={{ color: user.color }}
                    className={`font-semibold text-sm `}
                  >
                    {msg.userName}:{" "}
                  </span>
                  <span className="text-white mb-3 max-w-full break-words text-sm font-semibold">
                    {parseMessage(msg.content)}
                  </span>
                </div>
              </div>
            ))
        ) : (
          <span className="text-white text-sm font-semibold px-2">
            Welcome to Chat ✨
          </span>
        )}
      </div>
      <div className={`w-full py-1 relative`}>
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
          <div
            className={`h-auto text-white mt-1 ${
              reply ? "ring-1 ring-app_bg_light w-[220px] m-auto p-2" : "p-2"
            } space-y-2 text-sm rounded-sm`}
          >
            {reply && (
              <>
                <div className="flex items-center mb-2">
                  <span className="space-x-4 flex items-center">
                    <HiReply fontSize={"1.2rem"} />
                    <span className="font-semibold">
                      Reply to{" "}
                      <span className="font-semibold">@{reply.userName}</span>
                    </span>
                  </span>
                  <button
                    type={"button"}
                    onClick={() => {
                      setReply(undefined);
                    }}
                    className="absolute right-5 cursor-pointer hover:bg-zinc-600 active:bg-zinc-700 p-1 rounded-md "
                  >
                    <AiOutlineClose fontSize={".7rem"} />
                  </button>
                </div>
                <div className="max-h-24 overflow-y-auto chat font-normal text-xs">
                  {reply.userName}: {reply.content}
                </div>
              </>
            )}
            <div className="flex items-center bg-app_bg_deep rounded-sm py-1.5 px-2.5">
              <input
                value={chatContent}
                ref={chatInputRef}
                onChange={e => setMessage(e.target.value)}
                className="w-full border-none bg-app_bg_deep outline-none"
                placeholder="Send a message"
              />

              <span
                className="cursor-pointer hover:bg-zinc-600 active:bg-zinc-700 p-1 rounded-md "
                onClick={() => {
                  chatInputRef.current?.focus();
                  setPicker(!showPicker);
                }}
              >
                <MdOutlineEmojiEmotions fontSize={"1.2rem"} />
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  ) : // </div>
  null;
};

export default RoomChatArea;
