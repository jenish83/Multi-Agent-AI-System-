import { createSlice } from "@reduxjs/toolkit";

const conversationSlice = createSlice({
    name: "conversation",
    initialState: {
        conversations: [],
    },
    reducers: {
        setConversations: (state, action) => {
            state.conversations = action.payload;
        },
        addConversation: (state, action) => {
            state.conversations.unshift(action.payload);
        },
        updateConversation: (state, action) => {
            state.conversations = state.conversations.map(conversation => conversation.id === action.payload.id ? action.payload : conversation);
        },
        deleteConversation: (state, action) => {
            state.conversations = state.conversations.filter(conversation => conversation.id !== action.payload.id);
        },
        clearConversations: (state) => {
            state.conversations = [];
        },
    },
})

export const { setConversations, addConversation, updateConversation, deleteConversation, clearConversations } = conversationSlice.actions;
export default conversationSlice.reducer;