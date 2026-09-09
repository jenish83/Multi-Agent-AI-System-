export const getConversations = async () => {
    try {
        const { data } = await api.get("/api/chat/get-conversations")
        console.log(data)
    } catch (err) {
        console.log(err)
        return []
    }
};