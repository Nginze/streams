import { db } from "../config/drizzle";
import {
  userData,
  userFollows,
  roomStatus,
  room,
  userNotification,
} from "../db/schema";
import { eq, and, sql, inArray, isNull } from "drizzle-orm";

export class UserRepository {
  /**
   * Get user by ID with follow statistics
   */
  async getUserWithStats(userId: string, currentUserId: string) {
    const [user] = await db
      .select({
        userId: userData.userId,
        userName: userData.userName,
        email: userData.email,
        displayName: userData.displayName,
        avatarUrl: userData.avatarUrl,
        bio: userData.bio,
        currentRoomId: userData.currentRoomId,
        createdAt: userData.createdAt,
        lastSeen: userData.lastSeen,
        // Room status fields if joined
        isSpeaker: roomStatus.isSpeaker,
        isMod: roomStatus.isMod,
        raisedHand: roomStatus.raisedHand,
        isMuted: roomStatus.isMuted,
        // Follow stats
        followers: sql<number>`(SELECT COUNT(f.is_following) FROM ${userFollows} f WHERE f.is_following = ${userData.userId})`,
        following: sql<number>`(SELECT COUNT(f.user_id) FROM ${userFollows} f WHERE f.user_id = ${userData.userId})`,
        followsMe: sql<boolean>`EXISTS (SELECT 1 FROM ${userFollows} f WHERE f.user_id = ${currentUserId} AND f.is_following = ${userData.userId})`,
      })
      .from(userData)
      .innerJoin(roomStatus, eq(roomStatus.userId, userData.userId))
      .where(eq(userData.userId, userId));

    return user;
  }

  /**
   * Follow a user
   */
  async followUser(userId: string, userToFollow: string) {
    await db.insert(userFollows).values({
      userId,
      isFollowing: userToFollow,
      createdAt: sql`NOW()`,
    });
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(userId: string, userToUnfollow: string) {
    await db
      .delete(userFollows)
      .where(
        and(
          eq(userFollows.userId, userId),
          eq(userFollows.isFollowing, userToUnfollow)
        )
      );
  }

  /**
   * Update user bio
   */
  async updateBio(userId: string, bio: string) {
    await db.update(userData).set({ bio }).where(eq(userData.userId, userId));
  }

  /**
   * Update user avatar
   */
  async updateAvatar(userId: string, avatarUrl: string) {
    await db
      .update(userData)
      .set({ avatarUrl })
      .where(eq(userData.userId, userId));
  }

  /**
   * Get list of followed users with their online status and room info
   */
  async getFollowingList(userId: string, onlineUserIds: string[]) {
    const following = await db
      .select({
        userId: userData.userId,
        userName: userData.userName,
        avatarUrl: userData.avatarUrl,
        bio: userData.bio,
        currentRoomId: userData.currentRoomId,
        lastSeen: userData.lastSeen,
        roomDesc: room.roomDesc,
      })
      .from(userFollows)
      .innerJoin(userData, eq(userFollows.isFollowing, userData.userId))
      .leftJoin(room, eq(room.roomId, userData.currentRoomId))
      .where(eq(userFollows.userId, userId));

    // Add online status
    return following.map((user) => ({
      ...user,
      online: onlineUserIds.includes(user.userId || ""),
    }));
  }

  /**
   * Get online following users who are not in a room (for invites)
   */
  async getOnlineFollowingForInvite(userId: string, onlineUserIds: string[]) {
    // If no online users, return empty array


    if (!onlineUserIds || onlineUserIds.length === 0) {
      return [];
    }

    return await db.transaction(async (tx) => {
      // Get current user's room
      const [currentUser] = await tx
        .select({ currentRoomId: userData.currentRoomId })
        .from(userData)
        .where(eq(userData.userId, userId));

      // Get online following users not in a room
      const users = await tx
        .select({
          userId: userData.userId,
          userName: userData.userName,
          avatarUrl: userData.avatarUrl,
          bio: userData.bio,
          currentRoomId: userData.currentRoomId,
          lastSeen: userData.lastSeen,
          roomDesc: room.roomDesc,
        })
        .from(userFollows)
        .innerJoin(userData, eq(userFollows.isFollowing, userData.userId))
        .leftJoin(room, eq(room.roomId, userData.currentRoomId))
        .where(
          and(
            eq(userFollows.userId, userId),
            inArray(userData.userId, onlineUserIds),
            isNull(userData.currentRoomId)
          )
        );

      return users;
    });
  }

  /**
   * Update user's last seen timestamp
   */
  async updateLastSeen(userId: string) {
    await db
      .update(userData)
      .set({ lastSeen: sql`NOW()` })
      .where(eq(userData.userId, userId));
  }

  /**
   * Get user notifications
   */
  async getNotifications(userId: string) {
    const notifications = await db
      .select({
        notificationId: userNotification.notificationId,
        userId: userNotification.userId,
        roomId: userNotification.roomId,
        category: userNotification.category,
        content: userNotification.content,
        isRead: userNotification.isRead,
        createdAt: sql<string>`TO_CHAR(${userNotification.createdAt}, 'YYYY-MM-DD HH24:MI:SS')`,
      })
      .from(userNotification)
      .where(eq(userNotification.userId, userId));

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
    await db.insert(userNotification).values({
      userId: data.userId,
      roomId: data.roomId,
      category: data.category,
      content: data.content,
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markNotificationsAsRead(userId: string) {
    await db
      .update(userNotification)
      .set({ isRead: true })
      .where(eq(userNotification.userId, userId));
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string) {
    await db
      .delete(userNotification)
      .where(eq(userNotification.notificationId, notificationId));
  }

  /**
   * Get follow counts for a user
   */
  async getFollowCounts(userId: string) {
    const [counts] = await db
      .select({
        followers: sql<number>`(SELECT COUNT(*) FROM ${userFollows} WHERE is_following = ${userId})`,
        following: sql<number>`(SELECT COUNT(*) FROM ${userFollows} WHERE user_id = ${userId})`,
      })
      .from(userData)
      .where(eq(userData.userId, userId))
      .limit(1);

    return counts || { followers: 0, following: 0 };
  }

  /**
   * Get user by ID (simple query)
   */
  async getUserById(userId: string) {
    const [user] = await db
      .select()
      .from(userData)
      .where(eq(userData.userId, userId));
    return user;
  }

  /**
   * Check if user follows another user
   */
  async checkFollows(userId: string, targetUserId: string) {
    const [follows] = await db
      .select()
      .from(userFollows)
      .where(
        and(
          eq(userFollows.userId, userId),
          eq(userFollows.isFollowing, targetUserId)
        )
      );
    return !!follows;
  }

  /**
   * Get followers list for a user
   */
  async getFollowers(userId: string) {
    const followers = await db
      .select({
        userId: userData.userId,
        userName: userData.userName,
        displayName: userData.displayName,
        avatarUrl: userData.avatarUrl,
        bio: userData.bio,
      })
      .from(userFollows)
      .innerJoin(userData, eq(userFollows.userId, userData.userId))
      .where(eq(userFollows.isFollowing, userId));

    return followers;
  }

  /**
   * Get following list for a user
   */
  async getFollowing(userId: string) {
    const following = await db
      .select({
        userId: userData.userId,
        userName: userData.userName,
        displayName: userData.displayName,
        avatarUrl: userData.avatarUrl,
        bio: userData.bio,
      })
      .from(userFollows)
      .innerJoin(userData, eq(userFollows.isFollowing, userData.userId))
      .where(eq(userFollows.userId, userId));

    return following;
  }
}

export const userRepository = new UserRepository();
