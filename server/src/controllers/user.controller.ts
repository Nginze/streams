import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { UserDTO } from "../types/User";
import { parseCamel } from "../utils/parseCamel";
import { redisClient } from "../config/redis";

export class UserController {
  /**
   * Get user by ID with stats
   * GET /user/:userId
   */
  async getUserWithStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { userId: myUserId } = req.user as UserDTO;

      const user = await userService.getUserWithStats(userId, myUserId);
      res.status(200).json(parseCamel(user));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Follow a user
   * POST /user/follow
   */
  async followUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.user as UserDTO;
      const { userToFollow } = req.body;

      const result = await userService.followUser(userId, userToFollow);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unfollow a user
   * DELETE /user/unfollow/:userToUnfollow
   */
  async unfollowUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.user as UserDTO;
      const { userToUnfollow } = req.params;

      await userService.unfollowUser(userId, userToUnfollow);
      res.status(204).json();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user bio
   * PATCH /user/update/bio
   */
  async updateBio(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.user as UserDTO;
      const { bio } = req.body;

      const result = await userService.updateBioWithValidation(userId, bio);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user avatar
   * PATCH /user/update/avatar
   */
  async updateAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.user as UserDTO;
      const { avatarUrl } = req.body;

      const result = await userService.updateAvatar(userId, avatarUrl);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get following list with online status
   * GET /user/following/onlineList
   */
  async getFollowingOnlineList(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { userId } = req.user as UserDTO;

      const onlineUserIds = await redisClient.smembers("onlineUsers");
      const people = await userService.getFollowingOnlineList(
        userId,
        onlineUserIds
      );

      res.status(200).json(parseCamel(people));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get online following users for invite
   * GET /user/invite/online
   */
  async getOnlineFollowingForInvite(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { userId } = req.user as UserDTO;

      const onlineUserIds = await redisClient.smembers("onlineUsers");
      const users = await userService.getOnlineFollowingForInvite(
        userId,
        onlineUserIds
      );

      res.status(200).json(parseCamel(users));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Ping user (update last seen)
   * POST /user/ping
   */
  async pingUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.query as { userId: string };

      const result = await userService.pingUser(userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user notifications
   * GET /user/notification/:userId
   */
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      const notifications = await userService.getNotifications(userId);
      res.status(200).json(parseCamel(notifications));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a notification
   * POST /user/notification/:userId
   */
  async createNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { category, content, roomId } = req.body;

      const result = await userService.createNotification({
        userId,
        roomId,
        category,
        content,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notifications as read
   * PATCH /user/notification/markAsRead/:userId
   */
  async markNotificationsAsRead(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { userId } = req.params;

      const result = await userService.markNotificationsAsRead(userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a notification
   * DELETE /user/notification/:notificationId
   */
  async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const { notificationId } = req.params;

      const result = await userService.deleteNotification(notificationId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get follow counts (followers and following)
   * GET /user/me/metrics/followCount
   */
  async getFollowCounts(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.user as UserDTO;

      const counts = await userService.getFollowCounts(userId);
      res.status(200).json(counts);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user profile
   * GET /user/profile/:userId
   */
  async getUserProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const currentUser = req.user as UserDTO;
      const currentUserId = currentUser?.userId;

      const profile = await userService.getUserProfile(userId, currentUserId);
      res.status(200).json(parseCamel(profile));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get followers
   * GET /user/followers/:userId
   */
  async getFollowers(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      const followers = await userService.getFollowers(userId);
      res.status(200).json(parseCamel(followers));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get following
   * GET /user/following/:userId
   */
  async getFollowing(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      const following = await userService.getFollowing(userId);
      res.status(200).json(parseCamel(following));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread notification count
   * GET /user/notifications/unread/count
   */
  async getUnreadNotificationCount(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { userId } = req.user as UserDTO;

      const count = await userService.getUnreadNotificationCount(userId);
      res.status(200).json({ count });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
