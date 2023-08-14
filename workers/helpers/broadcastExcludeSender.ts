export const broadcastExcludeSender = (io: any, event: any) => {
  const clients = io.sockets.adapter.rooms.get(event.d.roomId);
  if (!clients) {
    return;
  }
  for (const sid of clients) {
    if (event.peerId == sid) {
      continue;
    }
    io.to(sid).emit(event.op, { ...event.d });
  }
};
