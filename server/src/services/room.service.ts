import { roomRepository } from "../repositories/room.repository";
import createHttpError from "http-errors";

export class RoomService {
  /**
   * Create a new room with categories
   */
  async createRoom(data: {
    roomDesc: string;
    creatorId: string;
    isPrivate: boolean;
    autoSpeaker: boolean;
    chatEnabled: boolean;
    handRaiseEnabled: boolean;
    categories: string[];
  }) {
    if (!data.roomDesc || !data.creatorId) {
      throw createHttpError(400, "Bad request, invalid credentials sent");
    }

    const newRoom = await roomRepository.createRoom(data);
    return newRoom;
  }

  /**
   * Join a room - validates access and sets up user in room
   */
  async joinRoom(roomId: string, userId: string) {
    if (!roomId || !userId) {
      throw createHttpError(400, "Bad request, incorrect credentials sent");
    }

    // Check if room exists
    const room = await roomRepository.getRoomById(roomId);
    if (!room) {
      return { status: "404", message: "Room not found" };
    }

    // Check if user is banned
    const banned = await roomRepository.checkBan(userId, roomId, "room_ban");
    if (banned) {
      return { status: "403", message: "User is banned from this room" };
    }

    // Join room transaction
    const result = await roomRepository.joinRoom(
      roomId,
      userId,
      room.autoSpeaker || false,
      room.creatorId || ""
    );

    return {
      status: "200",
      data: {
        ...result.room,
        participants: result.participants,
        categories: result.categories,
      },
    };
  }

  /**
   * Get all live/active rooms
   */
  async getLiveRooms(limit: number = 5) {
    const rooms = await roomRepository.getLiveRooms(limit);
    return rooms;
  }

  /**
   * Get room status for a specific user
   */
  async getRoomStatus(roomId: string, userId: string) {
    if (!roomId || !userId) {
      throw createHttpError(400, "Bad request, invalid credentials sent");
    }

    const status = await roomRepository.getRoomStatus(userId, roomId);

    if (!status) {
      throw createHttpError(404, "Room status not found");
    }

    return status;
  }

  /**
   * Leave a room - cleanup user session
   */
  async leaveRoom(roomId: string, userId: string) {
    if (!roomId || !userId) {
      throw createHttpError(400, "Bad request, invalid credentials sent");
    }

    await roomRepository.leaveRoom(userId, roomId);

    return { message: "User session cleaned up" };
  }

  /**
   * Destroy a room completely
   */
  async destroyRoom(roomId: string) {
    if (!roomId) {
      throw createHttpError(400, "Bad request, invalid credentials sent");
    }

    await roomRepository.destroyRoom(roomId);

    return { message: "Room destroyed" };
  }

  /**
   * Soft delete a room (mark as ended)
   */
  async softDeleteRoom(roomId: string) {
    if (!roomId) {
      throw createHttpError(400, "Bad request, invalid credentials sent");
    }

    await roomRepository.softDeleteRoom(roomId);

    return { message: "Room soft ended" };
  }

  /**
   * Update room status for a user (speaker, mod, muted, raised hand)
   */
  async updateRoomStatus(
    userId: string,
    roomId: string,
    state: "isSpeaker" | "isMod" | "raisedHand" | "isMuted",
    value: boolean
  ) {
    if (!roomId || !userId || !state || value === undefined) {
      throw createHttpError(400, "Bad request, invalid credentials sent");
    }

    // Validate state field
    const validStates = ["isSpeaker", "isMod", "raisedHand", "isMuted"];
    if (!validStates.includes(state)) {
      throw createHttpError(400, "Invalid state field");
    }

    await roomRepository.updateRoomStatusField(userId, roomId, state, value);

    return { message: "Permissions updated" };
  }

  /**
   * Update room settings (chat_enabled, hand_raise_enabled, auto_speaker, etc.)
   */
  async updateRoomSettings(
    roomId: string,
    state: "chatEnabled" | "handRaiseEnabled" | "autoSpeaker" | "isPrivate" | "roomDesc",
    value: string | boolean
  ) {
    if (!state || value === undefined) {
      throw createHttpError(400, "Bad request, invalid credentials sent");
    }

    // Validate state field
    const validStates = [
      "chatEnabled",
      "handRaiseEnabled",
      "autoSpeaker",
      "isPrivate",
      "roomDesc",
    ];
    if (!validStates.includes(state)) {
      throw createHttpError(400, "Invalid state field");
    }

    // Additional validation for roomDesc
    if (state === "roomDesc") {
      if (typeof value !== "string") {
        throw createHttpError(400, "Room description must be a string");
      }
      if (value.length > 50) {
        throw createHttpError(400, "Room description exceeds maximum length of 50 characters");
      }
    }

    await roomRepository.updateRoomField(roomId, state, value);

    return { message: "Room settings updated" };
  }

  /**
   * Ban a user from a room
   */
  async banUser(roomId: string, userId: string, banType: string) {
    if (!userId || !banType) {
      throw createHttpError(400, "Bad request, invalid credentials sent");
    }

    await roomRepository.banUser(roomId, userId, banType);

    return { message: "User banned" };
  }

  /**
   * Unban a user from a room
   */
  async unbanUser(roomId: string, userId: string, banType: string) {
    if (!userId || !banType) {
      throw createHttpError(400, "Bad request, invalid credentials sent");
    }

    await roomRepository.unbanUser(roomId, userId, banType);

    return { message: "User unbanned" };
  }

  /**
   * Get all bans for a room
   */
  async getRoomBans(roomId: string) {
    if (!roomId) {
      throw createHttpError(400, "Bad request, invalid credentials sent");
    }

    const bans = await roomRepository.getRoomBans(roomId);
    return bans;
  }

  /**
   * Validate room creation data
   */
  private validateRoomData(data: {
    roomDesc: string;
    categories: string[];
  }): { valid: boolean; error?: string } {
    if (!data.roomDesc || data.roomDesc.trim().length === 0) {
      return { valid: false, error: "Room description is required" };
    }

    if (data.roomDesc.length > 50) {
      return { valid: false, error: "Room description exceeds maximum length" };
    }

    if (!data.categories || data.categories.length < 2) {
      return { valid: false, error: "At least 2 categories are required" };
    }

    if (data.categories.length > 3) {
      return { valid: false, error: "Maximum 3 categories allowed" };
    }

    return { valid: true };
  }

  /**
   * Create room with validation
   */
  async createRoomWithValidation(data: {
    roomDesc: string;
    creatorId: string;
    isPrivate: boolean;
    autoSpeaker: boolean;
    chatEnabled: boolean;
    handRaiseEnabled: boolean;
    categories: string[];
  }) {
    const validation = this.validateRoomData({
      roomDesc: data.roomDesc,
      categories: data.categories,
    });

    if (!validation.valid) {
      throw createHttpError(400, validation.error!);
    }

    return await this.createRoom(data);
  }

  /**
   * Get room with full details (participants, categories)
   */
  async getRoomDetails(roomId: string, userId: string) {
    if (!roomId || !userId) {
      throw createHttpError(400, "Bad request, invalid credentials sent");
    }

    const room = await roomRepository.getRoomById(roomId);
    if (!room) {
      throw createHttpError(404, "Room not found");
    }

    const categories = await roomRepository.getRoomCategories(roomId);
    const participants = await roomRepository.getRoomParticipants(
      roomId,
      userId
    );

    return {
      ...room,
      categories,
      participants,
    };
  }

  /**
   * Check if user can join room (not banned, room exists)
   */
  async canJoinRoom(
    roomId: string,
    userId: string
  ): Promise<{ canJoin: boolean; reason?: string }> {
    const room = await roomRepository.getRoomById(roomId);
    if (!room) {
      return { canJoin: false, reason: "Room not found" };
    }

    const banned = await roomRepository.checkBan(userId, roomId, "room_ban");
    if (banned) {
      return { canJoin: false, reason: "User is banned from this room" };
    }

    if (room.ended) {
      return { canJoin: false, reason: "Room has ended" };
    }

    return { canJoin: true };
  }

  /**
   * Check if user is moderator in room
   */
  async isUserModerator(roomId: string, userId: string): Promise<boolean> {
    const status = await roomRepository.getRoomStatus(userId, roomId);
    return status?.isMod || false;
  }

  /**
   * Check if user is creator of room
   */
  async isUserCreator(roomId: string, userId: string): Promise<boolean> {
    const room = await roomRepository.getRoomById(roomId);
    return room?.creatorId === userId;
  }
}

export const roomService = new RoomService();
