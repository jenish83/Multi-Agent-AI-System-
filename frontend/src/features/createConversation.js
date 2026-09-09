import api from "../../utils/axois";

export const createConversation = async (conversation) => {
    try {
        const { data} = await api.get("/api/chat/create-conversation")
        console.log(data)
    } catch (err) {
        console.log(err)
    }
};