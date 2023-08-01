import { Request, Response, Router } from "express";
import { pool } from "../config/psql";
import { UserDTO } from "../types/User";
import { redisClient } from "../config/redis";
import { parseCamel } from "../utils/parseCamel";

export const router = Router();

router.get("/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { userId: myUserId } = req.user as UserDTO;
  const { rows } = await pool.query(
    `
    SELECT *,
        (SELECT COUNT(f.is_following) FROM user_follows f WHERE f.is_following = user_data.user_id) AS followers,
        (SELECT COUNT(f.user_id) FROM user_follows f WHERE f.user_id = user_data.user_id) AS following,
        EXISTS (SELECT 1 FROM user_follows f WHERE f.user_id = $2 AND f.is_following = user_data.user_id) AS follows_me 
    FROM user_data 
    INNER JOIN room_status AS rs ON rs.user_id = user_data.user_id
    WHERE user_data.user_id = $1;
    `,
    [userId, myUserId]
  );

  res.status(200).json(parseCamel(rows[0]));
});

router.post("/follow", async (req: Request, res: Response) => {
  const { userId } = req.user as UserDTO;
  const { userToFollow } = req.body;

  if (!userId || !userToFollow) {
    return res
      .status(400)
      .json({ msg: "Bad request, incorrect credentials sent" });
  }

  await pool.query(
    `
    INSERT INTO user_follows (user_id, is_following)
    VALUES ($1, $2)
    `,
    [userId, userToFollow]
  );

  res.status(200).json({ msg: "Follow created" });
});

router.delete(
  "/unfollow/:userToUnfollow",
  async (req: Request, res: Response) => {
    const { userId } = req.user as UserDTO;
    const { userToUnfollow } = req.params;

    if (!userId || !userToUnfollow) {
      return res
        .status(400)
        .json({ msg: "Bad request, incorrect credentials sent" });
    }

    await pool.query(
      `
      DELETE FROM user_follows
      WHERE user_id = $1 AND is_following = $2;
      `,
      [userId, userToUnfollow]
    );

    res.status(204).json();
  }
);

router.patch("/update/bio", async (req: Request, res: Response) => {
  const { userId } = req.user as UserDTO;
  const { bio } = req.body;

  if (!userId || !req.body) {
    return res
      .status(400)
      .json({ msg: "Bad request, incorrect credentials sent" });
  }

  await pool.query(
    `
    UPDATE user_data
    SET bio = $1
    WHERE user_id = $2
    `,
    [bio , userId]
  );

  res.status(200).json({ msg: "updated user data" });
});

router.get("/following/onlineList", async (req: Request, res: Response) => {
  const { userId } = req.user as UserDTO;
  // await redisClient.srem("onlineUsers", '')
  const onlineUserIds = await redisClient.smembers("onlineUsers");

  const { rows } = await pool.query(
    `
    SELECT u.user_id, u.user_name, u.avatar_url, u.bio, u.current_room_id, TO_CHAR(u.last_seen, 'YYYY-MM-DD HH:MI:SS') as last_seen, r.room_desc
    FROM user_follows f
    INNER JOIN user_data u ON f.is_following = u.user_id
    LEFT JOIN room r on r.room_id = u.current_room_id
    WHERE f.user_id = $1
    `,
    [userId]
  );

  // console.log(rows);

  const people = rows.map(row => {
    if (onlineUserIds.includes(row.user_id)) {
      return {
        ...row,
        online: true,
      };
    }
    return {
      ...row,
      online: false,
    };
  });

  res.status(200).json(parseCamel(people));
});

router.get("/invite/online", async (req: Request, res: Response) => {
  const { userId } = req.user as UserDTO;

  const onlineUserIds = await redisClient.smembers("onlineUsers");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: users } = await client.query(
      `
      SELECT current_room_id FROM user_data 
      WHERE user_id = $1
    `,
      [userId]
    );

    console.log(users[0].current_room_id);

    const { rows } = await client.query(
      `
    SELECT u.user_id, u.user_name, u.avatar_url, u.bio, u.current_room_id, TO_CHAR(u.last_seen, 'YYYY-MM-DD HH:MI:SS') as last_seen, r.room_desc
    FROM user_follows f
    INNER JOIN user_data u ON f.is_following = u.user_id
    LEFT JOIN room r on r.room_id = u.current_room_id
    WHERE f.user_id = $1
    AND u.user_id = ANY($2)
    AND u.current_room_id is null 

    `,
      [userId, onlineUserIds]
    );

    await client.query("COMMIT");
    res.status(200).json(parseCamel(rows));
  } catch (error) {
    console.log(error);
  } finally {
    client.release();
  }
});

router.post("/ping", async (req: Request, res: Response) => {
  const { userId } = req.query;
  await pool.query(
    `
      UPDATE user_data
      SET last_seen = NOW()
      WHERE user_id = $1;
      `,
    [userId]
  );
  res.status(200).json({ msg: "last seen updated" });
});

router.get("/notification/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { rows: notifications } = await pool.query(
    `
      SELECT un.* , TO_CHAR(un.created_at, 'YYYY-MM-DD HH:MI:SS') as createdAt 
      FROM user_notification un
      WHERE user_id = $1
      `,
    [userId]
  );
  res.status(200).json(parseCamel(notifications));
});

router.post("/notification/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { category, content, roomId } = req.body;
  await pool.query(
    `
      INSERT into user_notification
      VALUES (
        $1, $2, $3, $4
      )
    `,
    [userId, roomId, category, content]
  );
  res.status(200).json({ msg: "notification created" });
});

router.patch(
  "/notification/markAsRead/:userId",
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    await pool.query(
      `
      UPDATE user_notification
      SET is_read = true
      WHERE user_id = $1
    `,

      [userId]
    );
    res.status(200).json({ msg: "notification marked as read" });
  }
);

router.delete(
  "/notification/:notificationId",
  async (req: Request, res: Response) => {
    const { notificationId } = req.params;
    await pool.query(
      `
      DELETE FROM
      user_notification
      WHERE notification_id = $1
    `,

      [notificationId]
    );
    res.status(200).json({ msg: "notification deleted" });
  }
);
