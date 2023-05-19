import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const redisClient = new Redis(process.env.REDIS_URI as string);

redisClient.on("error", err => {
  console.log(err);
});

redisClient.on("ready", () => {
    console.log("[redis]: connected to redis instance")
})

export { redisClient };
