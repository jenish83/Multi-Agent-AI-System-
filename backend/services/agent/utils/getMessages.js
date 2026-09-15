import axios from "axios"

export const getMessages = async (conversationId) => {
    try {
        const { data} = await axios.get(`${process.env.CHAT_SERVICE}/get-messages?conversationId=${conversationId}`, {
            headers: {
                "x-user-id": process.env.USER_ID
            }
        })
        return data.messages || []
    } catch (error) {
        console.error("getMessages error:", error)
        throw error
    }
}