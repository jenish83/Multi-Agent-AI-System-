import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },

        role: {
            type: String,
            enum: ["user", "assistant"],
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

        files: {
            type: [
                {
                    kind: {
                        type: String,
                        default: "pdf",
                    },

                    title: {
                        type: String,
                        default: "",
                    },

                    url: {
                        type: String,
                        default: "",
                    },

                    fileName: {
                        type: String,
                        default: "",
                    },
                },
            ],
            default: [],
        },

        artifacts: {
            type: [
                {
                    name: {
                        type: String,
                        required: true,
                    },

                    type: {
                        type: String,
                        required: true,
                    },

                    content: {
                        type: mongoose.Schema.Types.Mixed,
                        default: null,
                    },
                },
            ],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;