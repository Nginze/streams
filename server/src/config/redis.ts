import Redis from "ioredis";
import "dotenv/config";
import { logger } from "./logger";

const redisClient = new Redis(process.env.REDIS_URI as string, {password: process.env.QUEUE_PASSWORD});

redisClient.on("error", err => {
  logger.log({ level: "error", message: `${err}` });
});

redisClient.on("ready", () => {
  logger.log({ level: "info", message: "connected to redis instance" });
});

export { redisClient };
