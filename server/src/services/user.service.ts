import { userRepository } from "../repositories/user.repository";
import createHttpError from "http-errors";

export class UserService {
  /**
   * Get user with statistics and room status
   */
  async getUserWithStats(userId: string, currentUserId: string) {
    if (!userId || !currentUserId) {
      throw createHttpError(400, "Bad request, invalid credentials sent");
    }

    const user = await userRepository.getUserWithStats(userId, currentUserId);

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    return user;
  }

  /**
   * Get user by ID (simple)
   */
  async getUserById(userId: string) {
    if (!userId) {
      throw createHttpError(400, "Bad request, invalid user ID");
    }

    const user = await userRepository.getUserById(userId);

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    return user;
  }

  /**
   * Follow a user
   */
  async followUser(userId: string, userToFollow: string) {
    if (!userId || !userToFollow) {
      throw createHttpError(400, "Bad request, incorrect credentials sent");
    }

    // Check if trying to follow self
    if (userId === userToFollow) {
      throw createHttpError(400, "Cannot follow yourself");
    }

    // Check if user to follow exists
    const targetUser = await userRepository.getUserById(userToFollow);
    if (!targetUser) {
      throw createHttpError(404, "User to follow not found");
    }

    // Check if already following
    const alreadyFollowing = await userRepository.checkFollows(
      userId,
      userToFollow
    );
    if (alreadyFollowing) {
      throw createHttpError(400, "Already following this user");
    }

    await userRepository.followUser(userId, userToFollow);

    return { message: "Follow created" };
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(userId: string, userToUnfollow: string) {
    if (!userId || !userToUnfollow) {
      throw createHttpError(400, "Bad request, incorrect credentials sent");
    }

    // Check if actually following
    const isFollowing = await userRepository.checkFollows(userId, userToUnfollow);
    if (!isFollowing) {
      throw createHttpError(400, "Not following this user");
    }

    await userRepository.unfollowUser(userId, userToUnfollow);

    return { message: "Unfollowed successfully" };
  }

  /**
   * Update user bio
   */
  async updateBio(userId: string, bio: string) {
    if (!userId) {
      throw createHttpError(400, "Bad request, incorrect credentials sent");
    }

    // Validate bio length
    if (bio && bio.length > 500) {
      throw createHttpError(400, "Bio exceeds maximum length of 500 characters");
    }

    await userRepository.updateBio(userId, bio);

    return { message: "Updated user data" };
  }

  /**
   * Update user avatar
   */
  async updateAvatar(userId: string, avatarUrl: string) {
    if (!userId || !avatarUrl) {
      throw createHttpError(400, "Bad request, incorrect credentials sent");
    }

    // Basic URL validation
    if (!this.isValidUrl(avatarUrl)) {
      throw createHttpError(400, "Invalid avatar URL");
    }

    await userRepository.updateAvatar(userId, avatarUrl);

    return { message: "Updated user data" };
  }

  /**
   * Get following list with online status
   */
  async getFollowingOnlineList(userId: string, onlineUserIds: string[]) {
    if (!userId) {
      throw createHttpError(400, "Bad request, invalid credentials sent");
    }

    const followingList = await userRepository.getFollowingList(
      userId,
      onlineUserIds
    );

    return followingList;
  }

  /**
   * Get online following users not in a room (for invites)
   */
  async getOnlineFollowingForInvite(
    userId: string,
    onlineUserIds: string[]
  ) {
    if (!userId) {
      throw createHttpError(400, "Bad request, invalid credentials sent");
    }

    const users = await userRepository.getOnlineFollowingForInvite(
      userId,
      onlineUserIds
    );

    return users;
  }

  /**
   * Update user's last seen timestamp
   */
  async pingUser(userId: string) {
    if (!userId) {
      throw createHttpError(400, "Bad request, invalid credentials sent");
    }

    await userRepository.updateLastSeen(userId);

    return { message: "Last seen updated" };
  }

  /**
   * Get user notifications
   */
  async getNotifications(userId: string) {
    if (!userId) {
      throw createHttpError(400, "Bad request, invalid credentials sent");
    }

    const notifications = await userRepository.getNotifications(userId);

    return notifications;
  }

  /**
   * Create a notification
   */
  async createNotification(data: {
    userId: string;
    roomId: string;
    category: string;
    content: string;
  }) {
    if (!data.userId || !data.category || !data.content || !data.roomId) {
      throw createHttpError(400, "Bad request, invalid credentials sent");
    }

    // Validate category
    const validCategories = ["room_invite", "room_mention", "follow", "system"];
    if (!validCategories.includes(data.category)) {
      throw createHttpError(400, "Invalid notification category");
    }

    // Validate content length
    if (data.content.length > 255) {
      throw createHttpError(400, "Notification content too long");
    }

    await userRepository.createNotification(data);

    return { message: "Notification created" };
  }

  /**
   * Mark all notifications as read for a user
   */
  async markNotificationsAsRead(userId: string) {
    if (!userId) {
      throw createHttpError(400, "Bad request, invalid credentials sent");
    }

    await userRepository.markNotificationsAsRead(userId);

    return { message: "Notification marked as read" };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string) {
    if (!notificationId) {
      throw createHttpError(400, "Bad request, invalid notification ID");
    }

    await userRepository.deleteNotification(notificationId);

    return { message: "Notification deleted" };
  }

  /**
   * Get follow counts (followers and following)
   */
  async getFollowCounts(userId: string) {
    if (!userId) {
      throw createHttpError(400, "Bad request, invalid credentials sent");
    }

    const counts = await userRepository.getFollowCounts(userId);

    return counts;
  }

  /**
   * Get followers list for a user
   */
  async getFollowers(userId: string) {
    if (!userId) {
      throw createHttpError(400, "Bad request, invalid user ID");
    }

    const followers = await userRepository.getFollowers(userId);

    return followers;
  }

  /**
   * Get following list for a user
   */
  async getFollowing(userId: string) {
    if (!userId) {
      throw createHttpError(400, "Bad request, invalid user ID");
    }

    const following = await userRepository.getFollowing(userId);

    return following;
  }

  /**
   * Check if user follows another user
   */
  async checkFollows(userId: string, targetUserId: string): Promise<boolean> {
    if (!userId || !targetUserId) {
      return false;
    }

    return await userRepository.checkFollows(userId, targetUserId);
  }

  /**
   * Get user profile with follow information
   */
  async getUserProfile(userId: string, currentUserId: string) {
    if (!userId) {
      throw createHttpError(400, "Bad request, invalid user ID");
    }

    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw createHttpError(404, "User not found");
    }

    const followCounts = await userRepository.getFollowCounts(userId);
    const followsMe =
      currentUserId && currentUserId !== userId
        ? await userRepository.checkFollows(currentUserId, userId)
        : false;
    const iFollow =
      currentUserId && currentUserId !== userId
        ? await userRepository.checkFollows(userId, currentUserId)
        : false;

    return {
      ...user,
      followers: followCounts.followers,
      following: followCounts.following,
      followsMe,
      iFollow,
    };
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadNotificationCount(userId: string): Promise<number> {
    if (!userId) {
      throw createHttpError(400, "Bad request, invalid user ID");
    }

    const notifications = await userRepository.getNotifications(userId);
    return notifications.filter((n) => !n.isRead).length;
  }

  /**
   * Validate bio content
   */
  private validateBio(bio: string): { valid: boolean; error?: string } {
    if (!bio) {
      return { valid: true };
    }

    if (bio.length > 500) {
      return {
        valid: false,
        error: "Bio exceeds maximum length of 500 characters",
      };
    }

    // Check for inappropriate content (basic check)
    const inappropriateWords = ["spam", "scam"]; // Add more as needed
    const lowerBio = bio.toLowerCase();
    const hasInappropriate = inappropriateWords.some((word) =>
      lowerBio.includes(word)
    );

    if (hasInappropriate) {
      return { valid: false, error: "Bio contains inappropriate content" };
    }

    return { valid: true };
  }

  /**
   * Update bio with validation
   */
  async updateBioWithValidation(userId: string, bio: string) {
    const validation = this.validateBio(bio);

    if (!validation.valid) {
      throw createHttpError(400, validation.error!);
    }

    return await this.updateBio(userId, bio);
  }
}

export const userService = new UserService();
