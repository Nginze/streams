import { Request, Response, Router } from "express";
import { pool } from "../config/psql";
import { UserDTO } from "../types/User";
import { parseCamel } from "../utils/parseCamel";

export const router = Router();

type RoomInfo = {
  roomDesc: string;
  creatorId: string;
  isPrivate: boolean;
  autoSpeaker: boolean;
  chatEnabled: boolean;
  handRaiseEnabled: boolean;
  categories: string[];
};

router.post("/create", async (req: Request, res: Response) => {
  const roomInfo = {
    ...req.body,
    creatorId: (req.user as UserDTO).userId,
  } as RoomInfo;
  const {
    roomDesc,
    creatorId,
    isPrivate,
    autoSpeaker,
    chatEnabled,
    handRaiseEnabled,
    categories,
  } = roomInfo;

  if (!roomInfo) {
    return res
      .status(400)
      .json({ msg: "Bad request, invalide credentials sent" });
  }

  const client = await pool.connect();

  await client.query(`BEGIN`);

  const { rows } = await client.query(
    `
    INSERT INTO room (room_desc, is_private, auto_speaker, creator_id, chat_enabled, hand_raise_enabled)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING room_id;
    `,
    [roomDesc, isPrivate, autoSpeaker, creatorId, chatEnabled, handRaiseEnabled]
  );

  categories.forEach(async category => {
    await client.query(
      `
    INSERT INTO room_category (room_id, category) VALUES ($1, $2) 
    `,
      [rows[0].room_id, category]
    );
  });

  await client.query("COMMIT");

  if (rows.length > 0) {
    res.status(200).json(parseCamel(rows[0]));
  }
});

router.get("/:roomId", async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { userId } = req.query;

  if (!roomId || !userId) {
    return res
      .status(400)
      .json({ msg: "Bad request, incorrect credentials sent" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      `
      UPDATE user_data
      SET current_room_id = $1
      WHERE user_id = $2;
      `,
      [roomId, userId]
    );

    const { rows: room } = await client.query(
      `
      SELECT *
      FROM room
      WHERE room_id = $1;
      `,
      [roomId]
    );

    await client.query(
      `
      INSERT INTO room_status (room_id, user_id, is_speaker, is_mod, raised_hand, is_muted)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING;

      `,
      [
        roomId,
        userId,
        parseCamel(room[0]).autoSpeaker ||
          parseCamel(room[0]).creatorId == userId,
        parseCamel(room[0]).creatorId === userId,
        false,
        false,
      ]
    );

    const { rows: categories } = await client.query(
      `
      SELECT category FROM room_category 
      WHERE room_id = $1
      `,
      [roomId]
    );

    const { rows: participants } = await client.query(
      `
      SELECT *,
          (SELECT COUNT(f.is_following) FROM user_follows f WHERE f.is_following = user_data.user_id) AS followers,
          (SELECT COUNT(f.user_id) FROM user_follows f WHERE f.user_id = user_data.user_id) AS following,
          EXISTS (SELECT 1 FROM user_follows f WHERE f.user_id = $2 AND f.is_following = user_data.user_id) AS follows_me 
      FROM user_data
      INNER JOIN room_status AS rs ON rs.user_id = user_data.user_id
      WHERE rs.room_id = $1;
      `,
      [roomId, userId]
    );

    await client.query("COMMIT");
    return res.status(200).json({
      ...parseCamel(room[0]),
      participants: parseCamel(participants),
      categories,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

router.get("/rooms/live", async (req: Request, res: Response) => {
  const { rows: rooms } = await pool.query(
    `
    SELECT *,
    ARRAY(SELECT user_name FROM user_data WHERE current_room_id = room.room_id) AS participants,
    ARRAY(SELECT category FROM room_category WHERE room_id = room.room_id) AS categories
    FROM room
    LIMIT 5
    `
  );

  return res.status(200).json(parseCamel(rooms));
});

router.get(
  "/room-status/:roomId/:userId",
  async (req: Request, res: Response) => {
    const { roomId, userId } = req.params;

    if (!roomId || !userId) {
      return res
        .status(400)
        .json({ msg: "Bad request, invalide credentials sent" });
    }

    const { rows } = await pool.query(
      `
      SELECT u.user_id, is_speaker, is_mod, raised_hand, is_muted
      FROM room_status rs
      INNER JOIN user_data u ON rs.user_id = u.user_id
      WHERE rs.user_id = $1 AND room_id = $2
      `,
      [userId, roomId]
    );

    return res.status(200).json(parseCamel(rows[0]));
  }
);

router.post("/leave", async (req: Request, res: Response) => {
  const { userId } = (req.user as UserDTO) ? (req.user as UserDTO) : req.query;
  const { roomId } = req.query;

  console.log("hit leave end point");
  if (!roomId || !userId) {
    return res
      .status(400)
      .json({ msg: "Bad request, invalid credentials sent" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
      UPDATE user_data
      SET current_room_id = $1
      WHERE user_id = $2;

      `,
      [null, userId]
    );

    await client.query(
      `
      DELETE FROM room_status
      WHERE user_id = $1 AND room_id = $2;
      `,
      [userId, roomId]
    );

    await client.query("COMMIT");
    return res.status(200).json({ msg: "user session cleaned up" });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

router.post("/destroy", async (req: Request, res: Response) => {
  const { roomId } = req.query;

  console.log("hit destroy end point");
  if (!roomId ) {
    return res
      .status(400)
      .json({ msg: "Bad request, invalid credentials sent" });
  }

  const client = await pool.connect();

  await client.query(`BEGIN`);

  await client.query(
    `
    DELETE FROM room_category
    WHERE room_id = $1
    `,
    [roomId]
  );

  await client.query(
    `
    DELETE FROM room
    WHERE room_id = $1
    `,
    [roomId]
  );

  await client.query(`COMMIT`);

  return res.status(200).json({ msg: "room destroyed" });
});

router.put(
  "/room-status/update/:userId",
  async (req: Request, res: Response) => {
    const { state, value, roomId } = req.query;
    const { userId } = req.params;

    if (!roomId || !userId || !state || !value) {
      return res
        .status(400)
        .json({ msg: "Bad request, invalid credentials sent" });
    }

    await pool.query(
      `
        UPDATE room_status
        SET ${state} = $1
        WHERE user_id = $2 AND room_id = $3
      `,
      [value, userId, roomId]
    );

    res.status(200).json({ msg: "Permissions updated" });
  }
);

router.put("/settings/:roomId", async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { state, value } = req.query;
  if (!state || !value) {
    return res
      .status(400)
      .json({ msg: "Bad request, invalid credentials sent" });
  }

  await pool.query(
    `
      UPDATE room 
      SET ${state} = $1
      WHERE room_id = $2
    `,
    [value, roomId]
  );

  res.status(200).json({ msg: "Room settings updated" });
});
