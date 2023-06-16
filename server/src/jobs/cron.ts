import cron from "node-cron";
import { pool } from "../config/psql";

cron.schedule("*/10 * * * * *", async () => {
  try {

    await pool.query(
      "DELETE FROM room WHERE ended = true AND (current_timestamp - room_ended_at) > interval '30 seconds'"
    );

    // console.log("Deleted rows from room table successfully.");
  } catch (error) {
    console.error("Error deleting rows from room table:", error);
  }
});
