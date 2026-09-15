import { api } from "../../utils/axois";

async function sendMessage(payload) {
    try {
        console.log("📤 Sending payload:", payload);

        const { data } = await api.post("/api/agent/chat", payload || {});

        console.log("✅ API response:", data);

        return data;
    } catch (error) {
        console.error("❌ API Error:", error);

        console.error("Status:", error.response?.status);
        console.error("Response:", error.response?.data);
        console.error("Message:", error.message);

        return null;
    }
}

export default sendMessage;