import { NextFunction, Request, Response, Router } from "express";
import { processMessage } from "../ws/helpers/processMessage";
import { io } from "..";
import createHttpError from "http-errors";

export const router = Router();

router.post("/process", (req: Request, res: Response, next: NextFunction) => {
  try {
    const { event } = req.body;
    if (!event) {
      throw createHttpError(400, "Bad/Invalid credentials");
    }
    console.log("/worker/process");
    processMessage(event, event.peerId, io);
    res.status(200).json({ msg: "processed event" });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/invalidate",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { peerId } = req.body;
      if (!peerId) {
        throw createHttpError(400, "Bad/Invalid credentials");
      }
      console.log("/worker/invalidate");
      io.to(peerId as string).emit("invalidate-feed", {});
      res.status(200).json({ msg: "invalidated user feed" });
    } catch (error) {
      next(error);
    }
  }
);
