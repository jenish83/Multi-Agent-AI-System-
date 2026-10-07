import { api } from "../../utils/axois";

async function sendMessage(payload) {
    try {
        const isUpload = typeof FormData !== "undefined" && payload instanceof FormData;
        console.log("📤 Sending payload:", isUpload ? "[file upload]" : payload);

        const { data } = await api.post(
            "/api/agent/chat",
            isUpload ? payload : payload || {},
            { timeout: 600_000 },
        );

        console.log("✅ API response:", data);

        return data;
    } catch (error) {
        console.error("❌ API Error:", error);

        console.error("Status:", error.response?.status);
        console.error("Response:", error.response?.data);
        console.error("Message:", error.message);

        throw error;
    }
}

export default sendMessage;