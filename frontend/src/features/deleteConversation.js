import { api } from "../../utils/axois";

export const deleteConversationById = async (conversationId) => {
    try {
        const { data } = await api.delete(`/api/chat/delete-conversation/${conversationId}`);
        return data?.success ? data : null;
    } catch (err) {
        console.log(err);
        return null;
    }
};
