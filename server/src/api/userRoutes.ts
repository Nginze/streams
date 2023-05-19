import { Request, Response, Router } from "express";
import { pool } from "../config/psql";
import { user } from "../types/user";

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
    const { userToUnfollow } = req.query;

    try {
      await pool.query(
        `delete from follows where userid = $1 and isfollowing = $2`,
        [userid, userToUnfollow]
      );

      return res.status(204);
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
