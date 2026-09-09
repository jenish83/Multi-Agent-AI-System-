import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";


export const createConversation = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        console.log(userId);
        const conversation = await Conversation.create({
            userId: userId,
        })

        return res.status(201).json({
            success: true,
            conversation,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Failed to create conversation: ${error.message}`,
        })
    }
}


export const getConversations = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const conversations = await Conversation.find({ userId: userId }).sort({ updatedAt: -1 });
        return res.status(200).json({
            success: true,
            conversations,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Failed to get conversations: ${error.message}`,
        })
    }
}

export const updateConversation = async (req, res) => {
    try {
        const { conversationId } = req.body;
        const conversation = await Conversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() }, { new: true });
        return res.status(200).json({
            success: true,
            conversation,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Failed to update conversation: ${error.message}`,
        })
    }
}


export const saveMessage = async (req, res) => {
    try {
        const { conversationId, role, content } = req.body;
        const message = await Message.create({
            conversationId: conversationId,
            content: content,
            role: role,
        })

        return res.status(201).json({
            success: true,
            message,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Failed to save message: ${error.message}`,
        }) 
    }
}


export const getMessages = async (req, res) => {
    try {
        
        const messages = await Message.find({ conversationId:req.params.conversationId}).sort({ createdAt: 1});
        return res.status(200).json({
            success: true,
            messages,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Failed to get messages: ${error.message}`,
        })
    }
}