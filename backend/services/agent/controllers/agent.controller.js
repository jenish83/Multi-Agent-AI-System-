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
    files
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

export const agent = async (req, res) => {
    try {
        const { prompt, conversationId, agent: requestedAgent } = req.body;

        await Promise.all([
            addMessage(conversationId, { role: "user", content: prompt }),
            saveToChat(conversationId, "user", prompt),
        ]);

        const result = await graph.invoke({
            prompt,
            conversationId,
            memory: await getMemory(conversationId),
            agent: resolveRequestedAgent(requestedAgent),
        });

        const response = result.aiResponse;

        const images = Array.isArray(result.images) ? result.images.filter(Boolean) : [];
        const artifacts = Array.isArray(result.artifacts) ? result.artifacts : [];
        const files = Array.isArray(result.files) ? result.files.filter(Boolean) : [];

        await Promise.all([
            addMessage(conversationId, { role: "assistant", content: response }),
            saveToChat(conversationId, "assistant", response, images, artifacts, files),
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
        return res.status(500).json({
            message: `agent error: ${error.message}`,
        });
    }
};
