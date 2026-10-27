import Redis from "ioredis";

const fromHost = process.env.REDIS_HOST;
const redisUrl =
    process.env.REDIS_URL ||
    (fromHost
        ? fromHost.includes("://")
            ? fromHost
            : `redis://${fromHost}:6379`
        : "redis://127.0.0.1:6379");

const redis = new Redis(redisUrl, {
    family: 4,
    // Fail the command immediately when Redis is down so agents can continue.
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: 2000,
    commandTimeout: 2000,
    retryStrategy(times) {
        return Math.min(times * 200, 2000);
    },
});

const target = (() => {
    try {
        const parsed = new URL(redisUrl);
        const port = parsed.port || "6379";
        return `${parsed.hostname}:${port}`;
    } catch {
        return "unparsed redis url";
    }
})();

redis.on("connect", () => {
    console.log(`Connected to Redis at ${target}`);
});

let lastErrorLog = 0;
redis.on("error", (error) => {
    const now = Date.now();
    if (now - lastErrorLog < 10000) return;
    lastErrorLog = now;
    const detail = error?.message || error?.code || String(error);
    console.error(`Redis error (${target}):`, detail);
});

export const isRedisUnavailable = (error) => {
    const message = String(error?.message || "");
    const code = error?.code;
    return (
        error?.name === "MaxRetriesPerRequestError" ||
        code === "ECONNREFUSED" ||
        code === "ENOTFOUND" ||
        code === "ETIMEDOUT" ||
        code === "ECONNRESET" ||
        code === "NR_CLOSED" ||
        /max retries per request|connection is closed|enableofflinequeue|stream isn't writeable|getaddrinfo|timed out|command timed out/i.test(
            message
        )
    );
};

export default redis;
