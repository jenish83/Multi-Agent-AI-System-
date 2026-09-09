import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redis = new Redis(redisUrl, {
    family: 4,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        return Math.min(times * 200, 2000);
    },
});

redis.on("connect", () => {
    console.log("Connected to Redis");
});

redis.on("error", (error) => {
    const detail = error?.message || error?.code || String(error);
    console.error("Redis error:", detail);
});

export default redis;
