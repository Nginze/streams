import { logger } from "../config/logger";
import { pool } from "../config/psql";

export const cleanUp = async (userId: string, roomId: string) => {
  const client = await pool.connect();

  console.log("cleaning up user's room session", userId);

  try {
    await client.query("BEGIN");

    //Set user's current room to null
    await client.query(
      `
        UPDATE user_data
        SET current_room_id = NULL
        WHERE user_id = $1 
    `,
      [userId]
    );

    //Set user's last active
    await client.query(
      `
      UPDATE user_data
      SET last_seen = NOW() AT TIME ZONE 'UTC'
      WHERE user_id = $1;
      `,
      [userId]
    );

    if (roomId !== "") {
      //Delete the user's room status
      await client.query(
        `
        DELETE FROM
        room_status
        WHERE user_id = $1 and room_id = $2
    `,
        [userId, roomId]
      );

      // Update last active log of room
      await client.query(
        `
        UPDATE room
        SET last_active = NOW()
        WHERE room_id = $1
    `,
        [roomId]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error(error);
    throw error;
  }finally{
    client.release()
  }
};

export const getRoomParticipants = async (roomId: string) => {
  const client = await pool.connect();
  try {
    const { rows: participants } = await client.query(
      `
      SELECT user_id 
      FROM user_data
      WHERE current_room_id = $1
    `,
      [roomId]
    );
    return participants;
  } catch (error) {
    throw error;
  }
};
