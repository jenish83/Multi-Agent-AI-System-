import redis from "../../../shared/redis/redis.js";

const WINDOW_SECONDS = 60;

const Limits = {
    chat: 20,
    coding: 20,
    imageAnalyzer: 10,
    search: 5,
    pdf: 5,
    ppt: 5,
    imageGen: 5,
    pdfRAG: 5,
};

export const isRateLimitError = (error) =>
    error?.code === "RATE_LIMIT_EXCEEDED" ||
    error?.cause?.code === "RATE_LIMIT_EXCEEDED";

export const checkAgentLimit = async (agent, userId) => {
    const max = Limits[agent] ?? Limits.chat;
    const key = `rate:${agent}:${userId}`;

    const count = await redis.incr(key);
    if (count === 1) {
        await redis.expire(key, WINDOW_SECONDS);
    }

    if (count > max) {
        const ttl = await redis.ttl(key);
        const secondsLeft = ttl > 0 ? ttl : WINDOW_SECONDS;
        const minutes = Math.floor(secondsLeft / 60);
        const seconds = secondsLeft % 60;
        const time = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

        const error = new Error(
            `You have reached the maximum number of requests for this agent. Please try again in ${time}.`
        );
        error.code = "RATE_LIMIT_EXCEEDED";
        error.status = 429;
        throw error;
    }

    return {
        remaining: max - count,
        limit: max,
    };
};
