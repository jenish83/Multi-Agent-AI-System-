import axios from "axios";
import graph from "../graph/graph.js";
import { addMessage, getMemory } from "../config/memory.js";

const saveToChat = async (conversationId, role, content) => {
    await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
        conversationId,
        role,
        content,
    });
};

export const agent = async (req, res) => {
    try {
        const { prompt, conversationId } = req.body;

        await Promise.all([
            addMessage(conversationId, { role: "user", content: prompt }),
            saveToChat(conversationId, "user", prompt),
        ]);

        const result = await graph.invoke({
            prompt,
            conversationId,
            memory: await getMemory(conversationId),
        });

        const response = result.aiResponse;

        await Promise.all([
            addMessage(conversationId, { role: "assistant", content: response }),
            saveToChat(conversationId, "assistant", response),
        ]);

        return res.status(200).json({
            message: response,
            conversationId,
        });
    } catch (error) {
        console.error("AGENT ERROR:", error.message);
        console.error(error.stack);
        return res.status(500).json({
            message: `agent error: ${error.message}`,
        });
    }
};
