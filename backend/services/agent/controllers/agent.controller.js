import axios from "axios";
import graph from "../graph/graph.js";
import { addMessage, getMemory } from "../config/memory.js";
import { resolveRequestedAgent } from "../graph/router.js";

const saveToChat = async (conversationId, role, content, images, artifacts) => {
    await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
        conversationId,
        role,
        content,
        images,
        artifacts,
    });
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

        await Promise.all([
            addMessage(conversationId, { role: "assistant", content: response }),
            saveToChat(conversationId, "assistant", response, images, artifacts),
        ]);

        return res.status(200).json({
            message: response,
            conversationId,
            images,
            artifacts,
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
