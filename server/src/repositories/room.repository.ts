import { db } from "../config/drizzle";
import {
  room,
  roomCategory,
  roomStatus,
  roomBan,
  userData,
  userFollows,
} from "../db/schema";
import { eq, and, sql } from "drizzle-orm";

export class RoomRepository {
  /**
   * Create a new room with categories
   */
  async createRoom(roomData: {
    roomDesc: string;
    creatorId: string;
    isPrivate: boolean;
    autoSpeaker: boolean;
    chatEnabled: boolean;
    handRaiseEnabled: boolean;
    categories: string[];
  }) {
    return await db.transaction(async (tx) => {
      // Insert room
      const [newRoom] = await tx
        .insert(room)
        .values({
          roomDesc: roomData.roomDesc,
          isPrivate: roomData.isPrivate,
          autoSpeaker: roomData.autoSpeaker,
          creatorId: roomData.creatorId,
          chatEnabled: roomData.chatEnabled,
          handRaiseEnabled: roomData.handRaiseEnabled,
        })
        .returning({ roomId: room.roomId });

      // Insert categories
      if (roomData.categories.length > 0) {
        await tx.insert(roomCategory).values(
          roomData.categories.map((category) => ({
            roomId: newRoom.roomId,
            category,
          }))
        );
      }

      return newRoom;
    });
  }

  /**
   * Get room by ID
   */
  async getRoomById(roomId: string) {
    const [roomData] = await db
      .select()
      .from(room)
      .where(eq(room.roomId, roomId));
    return roomData;
  }

  /**
   * Check if user is banned from room
   */
  async checkBan(userId: string, roomId: string, banType: string) {
    const [ban] = await db
      .select()
      .from(roomBan)
      .where(
        and(
          eq(roomBan.userId, userId),
          eq(roomBan.roomId, roomId),
          eq(roomBan.banType, banType)
        )
      );
    return ban;
  }

  /**
   * Update room ended status
   */
  async updateRoomEnded(roomId: string, ended: boolean) {
    await db.update(room).set({ ended }).where(eq(room.roomId, roomId));
  }

  /**
   * Update user's current room
   */
  async updateUserCurrentRoom(userId: string, roomId: string | null) {
    await db
      .update(userData)
      .set({ currentRoomId: roomId })
      .where(eq(userData.userId, userId));
  }

  /**
   * Delete room status for user
   */
  async deleteRoomStatus(userId: string, roomId: string) {
    await db
      .delete(roomStatus)
      .where(
        and(eq(roomStatus.userId, userId), eq(roomStatus.roomId, roomId))
      );
  }

  /**
   * Insert room status for user
   */
  async insertRoomStatus(statusData: {
    roomId: string;
    userId: string;
    isSpeaker: boolean;
    isMod: boolean;
    raisedHand: boolean;
    isMuted: boolean;
  }) {
    await db.insert(roomStatus).values(statusData);
  }

  /**
   * Get room categories
   */
  async getRoomCategories(roomId: string) {
    const categories = await db
      .select({ category: roomCategory.category })
      .from(roomCategory)
      .where(eq(roomCategory.roomId, roomId));
    return categories;
  }

  /**
   * Get room participants with follow information
   */
  async getRoomParticipants(roomId: string, currentUserId: string) {
    const participants = await db
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
        isSpeaker: roomStatus.isSpeaker,
        isMod: roomStatus.isMod,
        raisedHand: roomStatus.raisedHand,
        isMuted: roomStatus.isMuted,
        followers: sql<number>`(SELECT COUNT(f.is_following) FROM ${userFollows} f WHERE f.is_following = ${userData.userId})`,
        following: sql<number>`(SELECT COUNT(f.user_id) FROM ${userFollows} f WHERE f.user_id = ${userData.userId})`,
        followsMe: sql<boolean>`EXISTS (SELECT 1 FROM ${userFollows} f WHERE f.user_id = ${currentUserId} AND f.is_following = ${userData.userId})`,
      })
      .from(userData)
      .innerJoin(roomStatus, eq(roomStatus.userId, userData.userId))
      .where(eq(roomStatus.roomId, roomId));

    return participants;
  }

  /**
   * Get live rooms
   */
  async getLiveRooms(limit: number = 5) {
    const rooms = await db
      .select({
        roomId: room.roomId,
        roomDesc: room.roomDesc,
        isPrivate: room.isPrivate,
        autoSpeaker: room.autoSpeaker,
        chatEnabled: room.chatEnabled,
        handRaiseEnabled: room.handRaiseEnabled,
        creatorId: room.creatorId,
        createdAt: room.createdAt,
        lastActive: room.lastActive,
        ended: room.ended,
        creator: sql<string>`(SELECT user_name FROM ${userData} WHERE user_id = ${room.creatorId})`,
        participants: sql<
          Array<{ user_name: string; avatar_url: string }>
        >`(SELECT json_agg(json_build_object('user_name', ud.user_name, 'avatar_url', ud.avatar_url)) FROM ${userData} ud WHERE ud.current_room_id = ${room.roomId})`,
        categories: sql<
          string[]
        >`ARRAY(SELECT category FROM ${roomCategory} WHERE room_id = ${room.roomId})`,
      })
      .from(room)
      .where(eq(room.ended, false))
      .limit(limit);

    return rooms;
  }

  /**
   * Get room status for user
   */
  async getRoomStatus(userId: string, roomId: string) {
    const [status] = await db
      .select({
        userId: userData.userId,
        isSpeaker: roomStatus.isSpeaker,
        isMod: roomStatus.isMod,
        raisedHand: roomStatus.raisedHand,
        isMuted: roomStatus.isMuted,
      })
      .from(roomStatus)
      .innerJoin(userData, eq(roomStatus.userId, userData.userId))
      .where(
        and(eq(roomStatus.userId, userId), eq(roomStatus.roomId, roomId))
      );

    return status;
  }

  /**
   * Leave room - cleanup user session
   */
  async leaveRoom(userId: string, roomId: string) {
    return await db.transaction(async (tx) => {
      // Update user's current room to null and set last seen
      await tx
        .update(userData)
        .set({
          currentRoomId: null,
          lastSeen: sql`NOW()`,
        })
        .where(eq(userData.userId, userId));

      // Delete room status
      await tx
        .delete(roomStatus)
        .where(
          and(eq(roomStatus.userId, userId), eq(roomStatus.roomId, roomId))
        );
    });
  }

  /**
   * Destroy room - delete room and all related data
   */
  async destroyRoom(roomId: string) {
    return await db.transaction(async (tx) => {
      // Delete room categories
      await tx.delete(roomCategory).where(eq(roomCategory.roomId, roomId));

      // Delete room status
      await tx.delete(roomStatus).where(eq(roomStatus.roomId, roomId));

      // Delete room
      await tx.delete(room).where(eq(room.roomId, roomId));
    });
  }

  /**
   * Soft delete room - mark as ended
   */
  async softDeleteRoom(roomId: string) {
    await db
      .update(room)
      .set({
        ended: true,
        lastActive: sql`NOW()`,
      })
      .where(eq(room.roomId, roomId));
  }

  /**
   * Update room status field
   */
  async updateRoomStatusField(
    userId: string,
    roomId: string,
    field: keyof typeof roomStatus.$inferSelect,
    value: boolean
  ) {
    await db
      .update(roomStatus)
      .set({ [field]: value })
      .where(
        and(eq(roomStatus.userId, userId), eq(roomStatus.roomId, roomId))
      );
  }

  /**
   * Update room settings field
   */
  async updateRoomField(
    roomId: string,
    field: keyof typeof room.$inferSelect,
    value: boolean | string
  ) {
    await db
      .update(room)
      .set({ [field]: value })
      .where(eq(room.roomId, roomId));
  }

  /**
   * Ban user from room
   */
  async banUser(roomId: string, userId: string, banType: string) {
    await db.insert(roomBan).values({
      roomId,
      userId,
      banType,
      createdAt: sql`NOW()`,
    });
  }

  /**
   * Unban user from room
   */
  async unbanUser(roomId: string, userId: string, banType: string) {
    await db
      .delete(roomBan)
      .where(
        and(
          eq(roomBan.roomId, roomId),
          eq(roomBan.userId, userId),
          eq(roomBan.banType, banType)
        )
      );
  }

  /**
   * Get all bans for a room
   */
  async getRoomBans(roomId: string) {
    const bans = await db
      .select({
        userId: roomBan.userId,
        avatarUrl: userData.avatarUrl,
        userName: userData.userName,
        displayName: userData.displayName,
        banType: roomBan.banType,
      })
      .from(roomBan)
      .innerJoin(userData, eq(roomBan.userId, userData.userId))
      .where(eq(roomBan.roomId, roomId))
      .orderBy(roomBan.createdAt);

    return bans;
  }

  /**
   * Join room transaction - handles all join operations
   */
  async joinRoom(
    roomId: string,
    userId: string,
    autoSpeaker: boolean,
    creatorId: string
  ) {
    return await db.transaction(async (tx) => {
      // Update room to not ended
      await tx.update(room).set({ ended: false }).where(eq(room.roomId, roomId));

      // Update user's current room
      await tx
        .update(userData)
        .set({ currentRoomId: roomId })
        .where(eq(userData.userId, userId));

      // Get room data
      const [roomData] = await tx
        .select()
        .from(room)
        .where(eq(room.roomId, roomId));

      // Delete existing room status
      await tx
        .delete(roomStatus)
        .where(
          and(eq(roomStatus.userId, userId), eq(roomStatus.roomId, roomId))
        );

      // Insert new room status
      await tx.insert(roomStatus).values({
        roomId,
        userId,
        isSpeaker: autoSpeaker || creatorId === userId,
        isMod: creatorId === userId,
        raisedHand: false,
        isMuted: true,
      });

      // Get categories
      const categories = await tx
        .select({ category: roomCategory.category })
        .from(roomCategory)
        .where(eq(roomCategory.roomId, roomId));

      // Get participants with follow info
      const participants = await tx
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
          isSpeaker: roomStatus.isSpeaker,
          isMod: roomStatus.isMod,
          raisedHand: roomStatus.raisedHand,
          isMuted: roomStatus.isMuted,
          followers: sql<number>`(SELECT COUNT(f.is_following) FROM ${userFollows} f WHERE f.is_following = ${userData.userId})`,
          following: sql<number>`(SELECT COUNT(f.user_id) FROM ${userFollows} f WHERE f.user_id = ${userData.userId})`,
          followsMe: sql<boolean>`EXISTS (SELECT 1 FROM ${userFollows} f WHERE f.user_id = ${userId} AND f.is_following = ${userData.userId})`,
        })
        .from(userData)
        .innerJoin(roomStatus, eq(roomStatus.userId, userData.userId))
        .where(eq(roomStatus.roomId, roomId));

      return {
        room: roomData,
        categories,
        participants,
      };
    });
  }
}

export const roomRepository = new RoomRepository();
