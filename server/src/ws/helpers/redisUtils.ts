import { Socket } from "socket.io";
import { redisClient } from "../../config/redis";

export const setUserOnline = (userId: string, socketId: string) => {
  redisClient.set(userId, socketId);
  redisClient.sadd("onlineUsers", userId);
};

export const setUserOffline = (userId: string, socketId: string) => {
  redisClient.srem("onlineUsers", userId);
  redisClient.del(userId);
};

export const getPeerId = async (userId: string) => {
  const peerId = await redisClient.get(userId);
  return peerId;
};

export const getUser = (socket: Socket) => {
  //@ts-ignore
  return socket.request.user;
};
