import axios from "axios";
import graph from "../graph/graph.js";

export const agent = async (req, res) => {
    try {
        const { prompt, conversationId } = req.body;

        console.log("🔥 1. Agent request received");
        console.log("Prompt:", prompt);
        console.log("Conversation ID:", conversationId);
        console.log("CHAT_SERVICE:", process.env.CHAT_SERVICE);

        console.log("🔥 2. Saving user message...");

        await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
            conversationId,
            role: "user",
            content: prompt
        });

        console.log("🔥 3. User message saved");

        console.log("🔥 4. Calling graph...");

        const result = await graph.invoke({
            prompt,
            conversationId
        });

        console.log("🔥 5. Graph completed");
        console.log("Graph result:", result);

        const response = result.aiResponse;

        console.log("🔥 6. Saving AI response...");

        await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
            conversationId,
            role: "assistant",
            content: response
        });

        console.log("🔥 7. Done");

        return res.status(200).json(response);

    } catch (error) {
        console.error("❌ AGENT ERROR");
        console.error("Message:", error.message);
        console.error("Response:", error.response?.data);
        console.error("Status:", error.response?.status);
        console.error(error.stack);

        return res.status(500).json({
            message: `agent error: ${error.message}`
        });
    }
};