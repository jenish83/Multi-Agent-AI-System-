import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    images: {
        type: [String],
        default: [],
    },
    artifacts: {
        type: [
            {
                name: { type: String, required: true },
                content: { type: String, default: "" },
                title: { type: String, default: "" },
            },
        ],
        default: [],
    },
},{timestamps: true})

const Message = mongoose.model('Message', messageSchema);

export default Message;