import axios from "axios";

export const isInsufficientCreditsError = (error) =>
    error?.code === "INSUFFICIENT_CREDITS" ||
    /insufficient credits/i.test(String(error?.message || ""));

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
        const status = error.response?.status;
        const message = error.response?.data?.message || "";
        if (status === 400 && /insufficient credits/i.test(message)) {
            const creditError = new Error("Insufficient credits");
            creditError.code = "INSUFFICIENT_CREDITS";
            throw creditError;
        }
        throw error;
    }
}
