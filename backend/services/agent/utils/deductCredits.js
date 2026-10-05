import axios from "axios";

export const deductCredits = async (userId, agentType) => {
    try {
        const {data} = await axios.post(`${process.env.AUTH_SERVICE}/deduct-credits`, {
            userId,
            agentType
        })
        return data;
    } catch (error) {
        console.error("Deduct credits error:", error);
        throw error;
    }
}