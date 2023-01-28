import { Request, Response, Router } from "express";
import { client } from "../config/psql";

export const router = Router();

router.post("/create", (req: Request, res: Response) => {
  const roomInfo = req.body;
  client
    .query(
      `
        insert into room (roomname, roomdesc, isprivate, autospeaker, chatmode, creatorid)
        values ($1, $2, $3, $4, $5, $6) returning roomid
      `,
      [...Object.values(roomInfo)]
    )
    .then(result => {
      if (result.rows.length > 0) {
        res.status(200).json(result.rows[0]);
      }
    })
    .catch(err => res.status(500).json(err));
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
      `insert into room_permission(roomid, userid, isspeaker) 
      values ($1, $2, $3)
     on conflict do nothing`,
      [roomid, userid, room[0].autospeaker]
    );
    const { rows: participants } = await client.query(
      `select * from "user"
     inner join room_permission as rp
     on rp.userid = "user".userid
     where currentroomid = $1
    `,
      [roomid]
    );
    res.status(200).json({ ...room[0], participants });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/:roomid/permissions", async (req: Request, res: Response) => {
  const { roomid } = req.params;
  const { userid } = req.query;
  try {
    const { rows } = await client.query(
      `select * from room_permission where userid = $1 and roomid = $2`,
      [userid, roomid]
    );
    res.status(200).json(rows[0]);
  } catch (err) {
    res.status(500).json(err);
  }
});

// router.get("/:id/participants", (req: Request, res: Response) => {
//   const { id } = req.params;

//   client
//     .query(
//       `select * from "user"
//        inner join room_permission as rp
//        on rp.userid = "user".userid
//        where currentroomid = $1`,
//       [id]
//     )
//     .then(result => console.log(result.rows[0]))
//     .catch(err => res.status(500).json(err));
// });
