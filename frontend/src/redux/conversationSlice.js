import { createSlice } from "@reduxjs/toolkit";

const conversationSlice = createSlice({
    name: "conversation",
    initialState: {
        conversations: [],
        selectedConversation: null,
    },
    reducers: {
        setConversations: (state, action) => {
            state.conversations = action.payload;
        },
        addConversation: (state, action) => {
            state.conversations.unshift(action.payload);
        },
        updateConversation: (state, action) => {
            state.conversations = state.conversations.map(conversation => conversation._id === action.payload._id ? action.payload : conversation);
        },
        deleteConversation: (state, action) => {
            const id = action.payload._id;
            state.conversations = state.conversations.filter(conversation => conversation._id !== id);
            if (state.selectedConversation?._id === id) {
                state.selectedConversation = null;
            }
        },
        clearConversations: (state) => {
            state.conversations = [];
        },
        setSelectedConversation: (state, action) => {
            state.selectedConversation = action.payload;
        },
        clearSelectedConversation: (state) => {
            state.selectedConversation = null;
        },
    },
})

export const { setConversations, addConversation, updateConversation, deleteConversation, clearConversations, setSelectedConversation, clearSelectedConversation } = conversationSlice.actions;
export default conversationSlice.reducer;