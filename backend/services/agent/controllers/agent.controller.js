import axios from "axios";
import graph from "../graph/graph.js";
import { addMessage, getMemory } from "../config/memory.js";
import { resolveRequestedAgent } from "../graph/router.js";

const saveToChat = async (
    conversationId,
    role,
    content,
    images,
    artifacts,
    files,
    userId
) => {
    try {
        const url = `${process.env.CHAT_SERVICE}/save-message`;

        console.log("========== SAVE TO CHAT ==========");
        console.log("URL:", url);
        console.log("conversationId:", conversationId);
        console.log("role:", role);
        console.log("content:", content);
        console.log("images:", images);
        console.log("artifacts:", artifacts);
        console.log("files:", files);

        const response = await axios.post(url, {
            conversationId,
            role,
            content,
            images,
            artifacts,
            files,
            userId,
         });

        console.log("Chat service response:", response.data);

        return response.data;
    } catch (error) {
        console.error("========== SAVE TO CHAT ERROR ==========");
        console.error("Status:", error.response?.status);
        console.error("Response:", error.response?.data);
        console.error("URL:", error.config?.url);
        console.error("Request:", error.config?.data);
        console.error("Message:", error.message);
        console.error("========================================");

        throw error;
    }
};

const rateLimitMessageFrom = (error) => {
    const candidates = [error?.message, error?.cause?.message];
    return (
        candidates.find((message) => /try again in/i.test(message || "")) ||
        "You have reached the maximum number of requests for this agent. Please try again later."
    );
};

export const agent = async (req, res,next) => {
    const { prompt, conversationId, agent: requestedAgent } = req.body;
    const userId = req.headers["x-user-id"];

    try {

        await Promise.all([
            addMessage(conversationId, { role: "user", content: prompt }),
            saveToChat(conversationId, "user", prompt, [], [], []),
        ]);

        const result = await graph.invoke({
            prompt,
            conversationId,
            memory: await getMemory(conversationId),
            agent: resolveRequestedAgent(requestedAgent),
            userId,
            file: req.file || null,
        });

        const response = result.aiResponse;

        const images = Array.isArray(result.images) ? result.images.filter(Boolean) : [];
        const artifacts = (Array.isArray(result.artifacts) ? result.artifacts : [])
            .filter((artifact) => artifact?.name)
            .map((artifact) => {
                const name = String(artifact.name).trim();
                const ext = name.split(".").pop()?.toLowerCase() || "text";
                return {
                    name,
                    type: artifact.type || ext,
                    content: artifact.content ?? null,
                };
            });
        const files = Array.isArray(result.files) ? result.files.filter(Boolean) : [];

        await Promise.all([
            addMessage(conversationId, { role: "assistant", content: response }),
            saveToChat(conversationId, "assistant", response, images, artifacts, files, userId),
        ]);

        return res.status(200).json({
            message: response,
            conversationId,
            images,
            artifacts,
            files,
            searchResults: result.searchResults,
        });
    } catch (error) {
        console.error("AGENT ERROR:", error.message);
        console.error(error.stack);

        const isInsufficientCredits =
            error.code === "INSUFFICIENT_CREDITS" ||
            error.cause?.code === "INSUFFICIENT_CREDITS" ||
            /insufficient credits/i.test(error.message || "");

        if (isInsufficientCredits) {
            const error = new Error("Insufficient credits. Please buy more credits.");
            error.code = "INSUFFICIENT_CREDITS";
            next(error);
            return;
        }

        const isRateLimitExceeded =
            error.code === "RATE_LIMIT_EXCEEDED" ||
            error.cause?.code === "RATE_LIMIT_EXCEEDED" ||
            /maximum number of requests|rate limit exceeded/i.test(error.message || "") ||
            /maximum number of requests|rate limit exceeded/i.test(error.cause?.message || "");

        if (isRateLimitExceeded) {
            const message = rateLimitMessageFrom(error);
            error.message = message;
            error.status = 429;
            error.code = "RATE_LIMIT_EXCEEDED";

            if (conversationId) {
                try {
                    await Promise.all([
                        addMessage(conversationId, { role: "assistant", content: message }),
                        saveToChat(conversationId, "assistant", message, [], [], [], userId),
                    ]);
                } catch (saveError) {
                    console.error("Failed to save rate limit message:", saveError.message);
                }
            }

            next(error);
            return;
        }

        next(error);
    }
};
