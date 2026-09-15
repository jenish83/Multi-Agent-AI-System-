import { api } from "../../utils/axois";

async function getMessages(conversationId) {
    try {
        const { data } = await api.get(`/api/chat/get-messages/${conversationId}`);
        console.log(data.messages);
        return data.messages || [];
    } catch (error) {
        console.log(error);
        return null;
    }
}

export default getMessages;
