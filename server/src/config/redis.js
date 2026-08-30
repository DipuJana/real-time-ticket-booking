import "./env.js";

import Redis from "ioredis";

console.log("Connecting to Redis...");

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {

  throw new Error("REDIS_URL is not defined");

}

export const redis = new Redis(redisUrl);

redis.on("connect", () => {

  console.log("Redis connected");

});

redis.on("error", (error) => {

  console.error("Redis connection error:", error);

});