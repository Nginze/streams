import { pool } from "../../config/psql";

export const deleteRoom = async (roomId: string) => {
  await pool.query(
    `
      DELETE FROM room
      WHERE room_id = $1`,
    [roomId]
  );
};
