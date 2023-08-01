import { pool } from "../config/psql";
import { logger } from "../config/logger";
import { redisClient } from "../config/redis";
import { Queue } from "bullmq";

const removeOfflineUsers = async () => {
  console.log("executing cron");
  const client = await pool.connect();
  try {
    const onlineUsers = await redisClient.smembers("onlineUsers");

    //if no-one is online just delete all room status
    if (onlineUsers.length === 0) {
      logger.info("No users online, cleaning up");
      await client.query("BEGIN");
      await client.query(`
        DELETE FROM room_status 
      `);
      await client.query(
        `
        UPDATE user_data
        set current_room_id = NULL
        `
      );
      await client.query("COMMIT");
      return;
    }

    await client.query("BEGIN");

    // deleted Mods list
    const { rows: deletedMods } = await client.query(`
      SELECT user_id, room_id FROM room_status
      WHERE user_id NOT IN (${onlineUsers.map(id => `'${id}'`).join(", ")})
      AND is_mod = true;
    `);

    // Kick out offline users from their rooms
    await client.query(`
      DELETE FROM room_status 
      WHERE user_id NOT IN (${onlineUsers.map(id => `'${id}'`).join(", ")})
    `);

    // List of remaining mods in each live room
    const { rows: onlineMods } = await client.query(`
      SELECT room_id, user_id FROM room_status
      WHERE user_id IN (${onlineUsers.map(id => `'${id}'`).join(", ")})
      AND is_mod = true;
    `);

    // Reassignment of mod to random user in respective rooms
    const roomToMod: Record<string, string[]> = {};

    onlineMods.forEach(row => {
      if (!roomToMod[row.room_id]) {
        roomToMod[row.room_id] = [];
      }
      roomToMod[row.room_id].push(row.user_id);
    });

    for (const deletedMod of deletedMods) {
      const { room_id, user_id } = deletedMod;
      if (!roomToMod[room_id] || roomToMod[room_id].length === 0) {
        const onlineUsersInRoom = onlineUsers.filter(async userId => {
          const currentRoomId = await getRoomIdByUserId(userId);
          return currentRoomId === room_id;
        });

        if (onlineUsersInRoom.length > 0) {
          const randomModIndex = Math.floor(
            Math.random() * onlineUsersInRoom.length
          );
          const randomModUserId = onlineUsersInRoom[randomModIndex];

          await client.query(`
            UPDATE room_status 
            SET is_mod = true
            WHERE user_id = '${randomModUserId}' AND room_id = '${room_id}';
          `);

          logger.info(
            `Assigned mod status to a random user (${randomModUserId}) in room (${room_id})`
          );
        }
      }
    }

    await client.query(
      `
        UPDATE user_data
        SET current_room_id = NULL
        WHERE user_id NOT IN (${onlineUsers.map(id => `'${id}'`).join(", ")})
        `
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
    throw error;
  }
};

const getRoomIdByUserId = async (userId: string) => {
  const { rows } = await pool.query(
    `
    SELECT current_room_id
    FROM user_data
    WHERE user_id = $1
    `,
    [userId]
  );

  console.log("getROomId", rows[0].current_room_id);

  return rows[0].current_room_id;
};

const scheduledQueue = new Queue('scheduledqueue')

scheduledQueue.add('clean_up_participants', {}, {
  repeat: {
    pattern: "*/10 * * * * *"
  }
})



// Delete Idle/Ended Rooms
// cron.schedule("*/10 * * * * *", async () => {
//   try {
//     await pool.query(
//       "DELETE FROM room WHERE ended = true AND (current_timestamp - room_ended_at) > interval '30 seconds'"
//     );

//     logger.info("Ended rooms deleted");
//   } catch (error) {
//     throw error;
//   }
// });

// Cleanup offline users
// cron.schedule("*/10 * * * * *", removeOfflineUsers);
