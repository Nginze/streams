import { Request, Response, Router } from "express";
import { client } from "../config/psql";
import { user } from "../types/user";

export const router = Router();

router.post("/create", (req: Request, res: Response) => {
  const roomInfo = req.body;
  roomInfo.isprivate = false;
  roomInfo.chatmode = false;
  roomInfo.creatorid = (req.user as user).userid;
  const { roomname, roomdesc, isprivate, autospeaker, chatmode, creatorid } =
    roomInfo;

  console.log(roomInfo);
  client
    .query(
      `
        insert into room (roomname, roomdesc, isprivate, autospeaker, creatorid)
        values ($1, $2, $3, $4, $5) returning roomid
      `,
      [roomname, roomdesc, isprivate, autospeaker, creatorid]
    )
    .then(result => {
      if (result.rows.length > 0) {
        res.status(200).json(result.rows[0]);
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

router.get("/:roomid", async (req: Request, res: Response) => {
  const { roomid } = req.params;
  const { userid } = req.query;
  try {
    await client.query(
      `update "user" set currentroomid = $1 where userid = $2`,
      [roomid, userid]
    );
    const { rows: room } = await client.query(
      `select * from room where roomid = $1`,
      [roomid]
    );

    await client.query(
      `insert into room_permission(roomid, userid, isspeaker, ismod, askedtospeak) 
      values ($1, $2, $3, $4, $5) on conflict do nothing 
     `,
      [
        roomid,
        userid,
        room[0].autospeaker || room[0].creatorid == userid,
        room[0].creatorid === userid,
        false,
      ]
    );
    const { rows: participants } = await client.query(
      `select *, 
      (select count(receiverid) from user_follow where receiverid = "user".userid) as followers, 
      (select count(causerid) from user_follow where causerid = "user".userid) as following from "user"
     inner join room_permission as rp
     on rp.userid = "user".userid
     where rp.roomid = $1
    `,
      [roomid]
    );
    res.status(200).json({ ...room[0], participants });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

router.get("/rooms/live", async (req: Request, res: Response) => {
  try {
    const { rows: rooms } = await client.query(
      `select *, array(select username from "user" where currentroomid = room.roomid) as participants from room`
    );
    res.status(200).json(rooms);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

router.get(
  "/room-permission/:roomId/:userId",
  async (req: Request, res: Response) => {
    try {
      const { roomId, userId } = req.params;
      const { rows } = await client.query(
        `select u.userid, isspeaker, ismod, askedtospeak, muted
         from room_permission as rp 
         inner join "user" as u
         on rp.userid = u.userid 
         where rp.userid = $1 and roomid = $2`,
        [userId, roomId]
      );
      res.status(200).json(rows[0]);
    } catch (err) {
      res.status(500).json(err);
      console.log(err);
    }
  }
);

router.post("/leave", async (req: Request, res: Response) => {
  console.log("leave called");
  try {
    const { userid } = req.user as user;
    console.log("[server]: ", req.query, userid);
    const { roomId } = req.query;
    await client.query(
      `update "user" set currentroomid = $1, muted = false where userid = $2`,
      [null, userid]
    );
    await client.query(
      `delete from room_permission where userid = $1 and roomid = $2 `,
      [userid, roomId]
    );
    res.status(200).json({ msg: "user session cleaned up" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

router.put("/room-permission/update", async (req: Request, res: Response) => {
  try {
    const column = req.query.permission;
    const val = req.query.val;
    const roomId = req.query.roomId;
    const actionId = req.query.actionId as string;
    let { userid } = req.user as user;

    if (actionId) {
      userid = actionId;
    }

    console.log(column, val, roomId, userid);
    if (column === "muted") {
      await client.query(`update "user" set ${column} = $1 where userid = $2`, [
        val,
        userid,
      ]);
    } else {
      val
        ? await client.query(
            `update room_permission set ${column} = $1 where userid = $2 and roomid = $3`,
            [val, userid, roomId]
          )
        : await client.query(
            `update room_permission set ${column} = NOT ${column} where userid = $1 and roomid = $2`,
            [userid, roomId]
          );
    }
    res.status(200).json({ msg: "Permissions updated" });
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
