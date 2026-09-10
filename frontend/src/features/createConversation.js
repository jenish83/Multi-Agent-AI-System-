import { api } from "../../utils/axois";

export const createConversation = async () => {
    try {
        const { data } = await api.get("/api/chat/create-conversation");
        return data.conversation;
    } catch (err) {
        console.log(err);
        return null;
    }
};