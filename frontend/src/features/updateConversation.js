import { api } from "../../utils/axois";

export const updateConversation = async (payload) => {
    try {
        const { data } = await api.post("/api/chat/update-conversation", payload);
        return data.conversation;
    } catch (err) {
        console.log(err.response?.data?.message || err.message);
        return null;
    }
};
