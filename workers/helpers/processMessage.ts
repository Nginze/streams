import { broadcastExcludeSender } from "./broadcastExcludeSender";

type Event = {
  op: string;
  userid: string;
  peerId: string;
  roomId: string;
  d: any;
};

export const processMessage = async (event: Event, sid: string, io: any) => {
  switch (event?.op) {
    case "room-created":
      io.to(sid).emit(event.op, {
        ...event.d,
      });
      break;
    case "you-joined-as-a-speaker":
      io.to(sid).emit(event.op, {
        ...event.d,
        roomId: event.d.roomId,
        peerId: event.d.peerId,
        userid: event.userid,
      });
      break;

    case "you-joined-as-a-peer":
      io.to(sid).emit(event.op, {
        ...event.d,
        roomId: event.d.roomId,
        peerId: event.d.peerId,
        userid: event.userid,
      });
      break;

    case "new-peer-speaker":
      io.to(event.peerId).emit(event.op, {
        ...event.d,
      });
      break;

    case "@send-track-done":
      console.log("@send-track-done fired to", sid);
      io.to(sid).emit(event.op, {
        d: event.d,
      });
      break;

    case "@get-recv-tracks-done":
      console.log("@get-recv-tracks-done fired to", sid);
      io.to(sid).emit(event.op, {
        ...event.d,
      });
      break;

    case "you-are-now-a-speaker":
      console.log("you are now a speaker fired to ", sid);
      io.to(sid).emit(event.op, {
        ...event.d,
      });
      break;

    case "user-left-room":
      broadcastExcludeSender(io, event);
    default:
      break;
  }
};
