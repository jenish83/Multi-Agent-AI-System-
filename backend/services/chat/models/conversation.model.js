import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    title:{
        type: String,
        default: 'New Conversation',
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }
},{timestamps: true})

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;