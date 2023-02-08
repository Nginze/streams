import { Rooms } from "../types/RoomState";

export const deleteRoom = (roomId: string, rooms: Rooms) => {
  if (!(roomId in rooms)) {
    return;
  }

  delete rooms[roomId];
};
