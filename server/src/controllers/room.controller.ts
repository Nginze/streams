import { Request, Response, NextFunction } from "express";
import { roomService } from "../services/room.service";
import { UserDTO } from "../types/User";
import { parseCamel } from "../utils/parseCamel";

export class RoomController {
  /**
   * Create a new room
   * POST /room/create
   */
  async createRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as UserDTO;
      const roomData = {
        ...req.body,
        creatorId: user.userId,
      };

      const result = await roomService.createRoomWithValidation(roomData);

      res.status(200).json(parseCamel(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get room by ID and join
   * GET /room/:roomId
   */
  async getRoomAndJoin(req: Request, res: Response, next: NextFunction) {
    try {
      const { roomId } = req.params;
      const { userId } = req.query as { userId: string };

      if (!roomId || !userId) {
        return res
          .status(400)
          .json({ msg: "Bad request, incorrect credentials sent" });
      }

      const result = await roomService.joinRoom(roomId, userId);

      if (result.status === "404") {
        return res.status(200).json("404");
      }

      if (result.status === "403") {
        return res.status(200).json("403");
      }

      return res.status(200).json(parseCamel(result.data));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all live rooms
   * GET /room/rooms/live
   */
  async getLiveRooms(req: Request, res: Response, next: NextFunction) {
    try {
      const rooms = await roomService.getLiveRooms(5);
      res.status(200).json(parseCamel(rooms));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get room status for a user
   * GET /room/room-status/:roomId/:userId
   */
  async getRoomStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { roomId, userId } = req.params;

      if (!roomId || !userId) {
        return res
          .status(400)
          .json({ msg: "Bad request, invalid credentials sent" });
      }

      const status = await roomService.getRoomStatus(roomId, userId);
      res.status(200).json(parseCamel(status));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Leave a room
   * POST /room/leave
   */
  async leaveRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as UserDTO;
      const userId = user ? user.userId : (req.query.userId as string);
      const { roomId } = req.query as { roomId: string };

      if (!roomId || !userId) {
        return res
          .status(400)
          .json({ msg: "Bad request, invalid credentials sent" });
      }

      const result = await roomService.leaveRoom(roomId, userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Destroy a room
   * POST /room/destroy
   */
  async destroyRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const { roomId } = req.query as { roomId: string };

      if (!roomId) {
        return res
          .status(400)
          .json({ msg: "Bad request, invalid credentials sent" });
      }

      const result = await roomService.destroyRoom(roomId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Soft delete a room (mark as ended)
   * POST /room/soft-delete
   */
  async softDeleteRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const { roomId } = req.query as { roomId: string };

      if (!roomId) {
        return res
          .status(400)
          .json({ msg: "Bad request, invalid credentials sent" });
      }

      const result = await roomService.softDeleteRoom(roomId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update room status for a user
   * PUT /room/room-status/update/:userId
   */
  async updateRoomStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { state, value, roomId } = req.query as {
        state: "isSpeaker" | "isMod" | "raisedHand" | "isMuted";
        value: string;
        roomId: string;
      };
      const { userId } = req.params;

      if (!roomId || !userId || !state || !value) {
        return res
          .status(400)
          .json({ msg: "Bad request, invalid credentials sent" });
      }

      const boolValue = value === "true";
      const result = await roomService.updateRoomStatus(
        userId,
        roomId,
        state,
        boolValue
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update room settings
   * PUT /room/settings/:roomId
   */
  async updateRoomSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const { roomId } = req.params;
      const { state, value } = req.query as {
        state: "chatEnabled" | "handRaiseEnabled" | "autoSpeaker" | "isPrivate" | "roomDesc";
        value: string;
      };

      if (!state || !value) {
        return res
          .status(400)
          .json({ msg: "Bad request, invalid credentials sent" });
      }

      // Parse value based on state type
      let parsedValue: string | boolean;
      if (state === "roomDesc") {
        parsedValue = value; // Keep as string
      } else {
        parsedValue = value === "true"; // Convert to boolean
      }

      const result = await roomService.updateRoomSettings(
        roomId,
        state,
        parsedValue
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Ban a user from a room
   * POST /room/ban/:roomId
   */
  async banUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { roomId } = req.params;
      const { userId, banType } = req.query as {
        userId: string;
        banType: string;
      };

      if (!userId || !banType) {
        return res
          .status(400)
          .json({ msg: "Bad request, invalid credentials sent" });
      }

      const result = await roomService.banUser(roomId, userId, banType);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unban a user from a room
   * DELETE /room/unban/:roomId
   */
  async unbanUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { roomId } = req.params;
      const { userId, banType } = req.query as {
        userId: string;
        banType: string;
      };

      if (!userId || !banType) {
        return res
          .status(400)
          .json({ msg: "Bad request, invalid credentials sent" });
      }

      const result = await roomService.unbanUser(roomId, userId, banType);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all bans for a room
   * GET /room/ban/:roomId
   */
  async getRoomBans(req: Request, res: Response, next: NextFunction) {
    try {
      const { roomId } = req.params;

      if (!roomId) {
        return res
          .status(400)
          .json({ msg: "Bad request, invalid credentials sent" });
      }

      const bans = await roomService.getRoomBans(roomId);
      res.status(200).json(parseCamel(bans));
    } catch (error) {
      next(error);
    }
  }
}

export const roomController = new RoomController();
