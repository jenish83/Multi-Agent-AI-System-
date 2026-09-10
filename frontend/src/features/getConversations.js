import { api } from "../../utils/axois";

export const getConversations = async () => {
    try {
        const { data } = await api.get("/api/chat/get-conversations");
        return data.conversations || [];
    } catch (err) {
        console.log(err);
        return [];
    }
};