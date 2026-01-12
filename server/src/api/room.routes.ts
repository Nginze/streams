import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { validate, validateParams, validateQuery } from "../middleware/validate.middleware";
import { roomController } from "../controllers/room.controller";
import {
  createRoomSchema,
  roomIdParamSchema,
  roomStatusParamsSchema,
  userIdParamSchema,
  leaveRoomQuerySchema,
  updateRoomStatusQuerySchema,
  updateRoomSettingsQuerySchema,
  banQuerySchema,
} from "../dtos/room.dto";

export const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Room CRUD
router.post(
  "/create",
  validate(createRoomSchema),
  roomController.createRoom.bind(roomController)
);

router.get(
  "/:roomId",
  validateParams(roomIdParamSchema),
  roomController.getRoomAndJoin.bind(roomController)
);

router.get("/rooms/live", roomController.getLiveRooms.bind(roomController));

router.get(
  "/room-status/:roomId/:userId",
  validateParams(roomStatusParamsSchema),
  roomController.getRoomStatus.bind(roomController)
);

router.post(
  "/leave",
  validateQuery(leaveRoomQuerySchema),
  roomController.leaveRoom.bind(roomController)
);

router.post(
  "/destroy",
  validateQuery(roomIdParamSchema),
  roomController.destroyRoom.bind(roomController)
);

router.post(
  "/soft-delete",
  validateQuery(roomIdParamSchema),
  roomController.softDeleteRoom.bind(roomController)
);

// Room status updates
router.put(
  "/room-status/update/:userId",
  validateParams(userIdParamSchema),
  validateQuery(updateRoomStatusQuerySchema),
  roomController.updateRoomStatus.bind(roomController)
);

router.put(
  "/settings/:roomId",
  validateParams(roomIdParamSchema),
  validateQuery(updateRoomSettingsQuerySchema),
  roomController.updateRoomSettings.bind(roomController)
);

// Ban management
router.post(
  "/ban/:roomId",
  validateParams(roomIdParamSchema),
  validateQuery(banQuerySchema),
  roomController.banUser.bind(roomController)
);

router.delete(
  "/unban/:roomId",
  validateParams(roomIdParamSchema),
  validateQuery(banQuerySchema),
  roomController.unbanUser.bind(roomController)
);

router.get(
  "/ban/:roomId",
  validateParams(roomIdParamSchema),
  roomController.getRoomBans.bind(roomController)
);
