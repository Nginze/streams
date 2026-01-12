import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { validate, validateParams, validateQuery } from "../middleware/validate.middleware";
import { userController } from "../controllers/user.controller";
import {
  followUserSchema,
  updateBioSchema,
  updateAvatarSchema,
  createNotificationSchema,
  userIdParamSchema,
  notificationIdParamSchema,
  userToUnfollowParamSchema,
  pingQuerySchema,
} from "../dtos/user.dto";

export const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// User profile
router.get(
  "/:userId",
  validateParams(userIdParamSchema),
  userController.getUserWithStats.bind(userController)
);

// Follow system
router.post(
  "/follow",
  validate(followUserSchema),
  userController.followUser.bind(userController)
);

router.delete(
  "/unfollow/:userToUnfollow",
  validateParams(userToUnfollowParamSchema),
  userController.unfollowUser.bind(userController)
);

// Update user data
router.patch(
  "/update/bio",
  validate(updateBioSchema),
  userController.updateBio.bind(userController)
);

router.patch(
  "/update/avatar",
  validate(updateAvatarSchema),
  userController.updateAvatar.bind(userController)
);

// Following lists
router.get(
  "/following/onlineList",
  userController.getFollowingOnlineList.bind(userController)
);

router.get(
  "/invite/online",
  userController.getOnlineFollowingForInvite.bind(userController)
);

// User activity
router.post(
  "/ping",
  validateQuery(pingQuerySchema),
  userController.pingUser.bind(userController)
);

// Notifications
router.get(
  "/notification/:userId",
  validateParams(userIdParamSchema),
  userController.getNotifications.bind(userController)
);

router.post(
  "/notification/:userId",
  validateParams(userIdParamSchema),
  validate(createNotificationSchema),
  userController.createNotification.bind(userController)
);

router.patch(
  "/notification/markAsRead/:userId",
  validateParams(userIdParamSchema),
  userController.markNotificationsAsRead.bind(userController)
);

router.delete(
  "/notification/:notificationId",
  validateParams(notificationIdParamSchema),
  userController.deleteNotification.bind(userController)
);

// Metrics
router.get(
  "/me/metrics/followCount",
  userController.getFollowCounts.bind(userController)
);
