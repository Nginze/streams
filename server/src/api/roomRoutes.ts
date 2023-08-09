import { NextFunction, Request, Response, Router } from "express";
import { pool } from "../config/psql";
import { UserDTO } from "../types/User";
import { parseCamel } from "../utils/parseCamel";
import createHttpError from "http-errors";

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

router.post(
  "/create",
  async (req: Request, res: Response, next: NextFunction) => {
    const client = await pool.connect();
    try {
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
        throw createHttpError(400, "Bad request, invalid credentials sent");
      }

      await client.query(`BEGIN`);

      const { rows } = await client.query(
        `
    INSERT INTO room (room_desc, is_private, auto_speaker, creator_id, chat_enabled, hand_raise_enabled)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING room_id;
    `,
        [
          roomDesc,
          isPrivate,
          autoSpeaker,
          creatorId,
          chatEnabled,
          handRaiseEnabled,
        ]
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
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  }
);

router.get(
  "/:roomId",
  async (req: Request, res: Response, next: NextFunction) => {
    const { roomId } = req.params;
    const { userId } = req.query;
    const { hasJoined } = req.query;
    console.log("joining room hasJoined: ", hasJoined)

    if (!roomId || !userId || hasJoined) {
      return res
        .status(400)
        .json({ msg: "Bad request, incorrect credentials sent" });
    }

    const { rows: room } = await pool.query(
      `
      SELECT *
      FROM room
      WHERE room_id = $1;
      `,
      [roomId]
    );

    const { rows: banned } = await pool.query(
      `
    SELECT *
    FROM room_ban
    WHERE user_id = $1
    AND room_id = $2
    AND ban_type=$3
    `,
      [userId, roomId, "room_ban"]
    );

    if (!room[0]) {
      console.log("no room found");
      return res.status(200).json("404");
    }

    if (banned[0]) {
      console.log("no room found");
      return res.status(200).json("403");
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `
      UPDATE room
      SET ended = false
      WHERE room_id = $1
      `,
        [roomId]
      );

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
      DELETE FROM room_status
      WHERE user_id = $1
      AND room_id = $2
      `,
        [userId, roomId]
      );

      await client.query(
        `
      INSERT INTO room_status (room_id, user_id, is_speaker, is_mod, raised_hand, is_muted)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [
          roomId,
          userId,
          parseCamel(room[0])?.autoSpeaker ||
            parseCamel(room[0])?.creatorId == userId,
          parseCamel(room[0])?.creatorId === userId,
          false,
          true,
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
    } catch (error) {
      await client.query("ROLLBACK");
      next(error);
    } finally {
      client.release();
    }
  }
);

router.get(
  "/rooms/live",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rows: rooms } = await pool.query(
        `
    SELECT *,
    (SELECT user_name FROM user_data WHERE user_id = room.creator_id) as creator,
    (
      SELECT json_agg(json_build_object('user_name', ud.user_name, 'avatar_url', ud.avatar_url))
      FROM user_data ud
      WHERE ud.current_room_id = room.room_id
    ) AS participants,
    ARRAY(SELECT category FROM room_category WHERE room_id = room.room_id) AS categories
    FROM room
    WHERE ended = false
    LIMIT 5
    `
      );

      return res.status(200).json(parseCamel(rooms));
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/room-status/:roomId/:userId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
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
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/leave",
  async (req: Request, res: Response, next: NextFunction) => {
    const client = await pool.connect();
    try {
      const { userId } = (req.user as UserDTO)
        ? (req.user as UserDTO)
        : req.query;
      const { roomId } = req.query;

      console.log("hit leave end point");

      if (!roomId || !userId) {
        return res
          .status(400)
          .json({ msg: "Bad request, invalid credentials sent" });
      }

      console.log(roomId, userId);

      await client.query("BEGIN");

      await client.query(
        `
      UPDATE user_data
      SET current_room_id = $1,last_seen = NOW()
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
    } catch (error) {
      await client.query("ROLLBACK");
      next(error);
    } finally {
      client.release();
    }
  }
);

router.post(
  "/destroy",
  async (req: Request, res: Response, next: NextFunction) => {
    const client = await pool.connect();
    try {
      const { roomId } = req.query;

      console.log("hit destroy end point");
      if (!roomId) {
        return res
          .status(400)
          .json({ msg: "Bad request, invalid credentials sent" });
      }

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
      DELETE FROM room_status
      WHERE room_id = $1;
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
    } catch (error) {
      await client.query("ROLLBACK");
      next(error);
    } finally {
      client.release();
    }
  }
);

router.post(`/soft-delete`, async (req: Request, res: Response) => {
  const { roomId } = req.query;

  console.log("hit destroy end point");
  if (!roomId) {
    return res
      .status(400)
      .json({ msg: "Bad request, invalid credentials sent" });
  }

  await pool.query(
    `
  UPDATE room
  SET ended = true, room_ended_at = NOW()
  WHERE room_id = $1
  `,
    [roomId]
  );

  res.status(200).json({ msg: "room soft ended" });
});

router.put(
  "/room-status/update/:userId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { state, value, roomId } = req.query;
      const { userId } = req.params;

      console.log(state, value);
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
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/settings/:roomId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
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
    } catch (error) {
      next(error);
    }
  }
);

router.post("/ban/:roomId", async (req: Request, res: Response) => {
  const { roomId } = req.params;

  const { userId, banType } = req.query;
  if (!userId || !banType) {
    return res
      .status(400)
      .json({ msg: "Bad request, invalid credentials sent" });
  }

  await pool.query(
    `
    INSERT INTO
    room_ban values 
    (
      $1, $2, $3, NOW()
    )
    `,
    [roomId, userId, banType]
  );

  res.status(200).json({ msg: "User banned" });
});

router.delete("/unban/:roomId", async (req: Request, res: Response) => {
  const { roomId } = req.params;

  const { userId, banType } = req.query;
  if (!userId || !banType) {
    return res
      .status(400)
      .json({ msg: "Bad request, invalid credentials sent" });
  }

  await pool.query(
    `
    DELETE FROM 
    room_ban
    WHERE room_id = $1 
    AND user_id = $2
    AND ban_type = $3
    `,
    [roomId, userId, banType]
  );

  res.status(200).json({ msg: "User unbanned" });
});

router.get("/ban/:roomId", async (req: Request, res: Response) => {
  const { roomId } = req.params;

  if (!roomId) {
    return res
      .status(400)
      .json({ msg: "Bad request, invalid credentials sent" });
  }

  const { rows: bans } = await pool.query(
    `
     SELECT
     room_ban.user_id,
     user_data.avatar_url,
     user_data.user_name,
     user_data.display_name,
     room_ban.ban_type 
     FROM room_ban
     INNER JOIN user_data
     ON room_ban.user_id = user_data.user_id 
     WHERE room_id = $1
     ORDER BY room_ban.created_at 
    `,
    [roomId]
  );

  res.status(200).json(parseCamel(bans));
});
