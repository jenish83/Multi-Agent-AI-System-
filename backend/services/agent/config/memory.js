import redis from "../../../shared/redis/redis.js";
import { getMessages } from "../utils/getMessages.js";

const TTL_SECONDS = 24 * 60 * 60;

const keyFor = (conversationId) => `messages:${conversationId}`;

const toStoredMessage = (message) => {
    if (!message) return null;

    const role =
        typeof message.role === "string"
            ? message.role
            : message.role?.role;
    const content =
        typeof message.content === "string"
            ? message.content
            : typeof message.role?.content === "string"
                ? message.role.content
                : null;

    if (!role || !content) return null;
    return { role, content };
};

export const getMemory = async (conversationId) => {
    const key = keyFor(conversationId);
    const cached = await redis.get(key);

    if (cached) {
        const parsed = JSON.parse(cached);
        return (Array.isArray(parsed) ? parsed : [])
            .map(toStoredMessage)
            .filter(Boolean);
    }

    const messages = await getMessages(conversationId);
    const normalized = (Array.isArray(messages) ? messages : [])
        .map(toStoredMessage)
        .filter(Boolean);

    await redis.set(key, JSON.stringify(normalized), "EX", TTL_SECONDS);
    return normalized;
};

export const addMessage = async (conversationId, message) => {
    const entry = toStoredMessage(message);
    if (!entry) return;

    const key = keyFor(conversationId);
    const rawMessages = await redis.get(key);
    const messages = rawMessages ? JSON.parse(rawMessages) : [];
    const list = Array.isArray(messages)
        ? messages.map(toStoredMessage).filter(Boolean)
        : [];

    list.push(entry);
    if (list.length > 20) {
        list.shift();
    }

    await redis.set(key, JSON.stringify(list), "EX", TTL_SECONDS);
};
