import axios from "axios";

export const deductCredits = async (userId, agentType) => {
    try {
        const authService = process.env.AUTH_SERVICE;
        if (!authService) {
            throw new Error("AUTH_SERVICE is missing in backend/services/agent/.env");
        }
        const {data} = await axios.post(`${authService}/deduct-credits`, {
            userId,
            agentType
        })
        return data;
    } catch (error) {
        console.error("Deduct credits error:", error);
        throw error;
    }
}