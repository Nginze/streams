import { Request, Response, Router } from "express";
import { pool } from "../config/psql";
import { user } from "../types/user";
import { redisClient } from "../config/redis";

export const router = Router();

router.post("/follow", async (req: Request, res: Response) => {
  const { userid } = req.user as user;
  const { userToFollow } = req.body;

  try {
    await pool.query(
      `
        insert into follows (userid, isfollowing)
        values ($1, $2) 
       `,
      [userid, userToFollow]
    );

    return res.status(200).json({ msg: "Follow created" });
  } catch (err) {
    return res.status(500).json(err);
  }
});

router.delete(
  "/unfollow/:userToUnfollow",
  async (req: Request, res: Response) => {
    const { userid } = req.user as user;
    const { userToUnfollow } = req.params;

    try {
      await pool.query(
        `delete from follows where userid = $1 and isfollowing = $2`,
        [userid, userToUnfollow]
      );

      return res.status(204).json();
    } catch (err) {
      return res.status(500).json(err);
    }
  }
);

router.patch("/update", async (req: Request, res: Response) => {
  const { userid } = req.user as user;
  const { username, bio, displayname, bannerurl, avatarurl } = req.body;

  try {
    await pool.query(
      `
      update "user"
      set bio= $1, avatarurl = $2
      where userid = $3
     `,
      [bio, avatarurl, userid]
    );

    res.status(200).json({ msg: "updated user data" });
  } catch (err) {
    return res.status(500).json(err);
  }
});

router.get("/online", async (req: Request, res: Response) => {
  const { userid } = req.user as user;
  try {
    const onlineUserIds = await redisClient.smembers("onlineUsers");
    console.log(onlineUserIds)
    const { rows } = await pool.query(
      `
      select u.userid, u.username, u.avatarurl, u.bio , u.currentroomid
      from follows f
      inner join "user" u 
      on f.isfollowing = u.userid
      where f.userid = $1
      and u.userid = ANY($2)
      and u.currentroomid is not null
   `,
      [userid, onlineUserIds]
    );

    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json(err);
  }
});
