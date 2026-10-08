import { createSlice } from "@reduxjs/toolkit";

const clearThinking = (state) => {
  state.isThinking = false;
  state.pendingPrompt = "";
  state.thinkingConversationId = null;
};

const messageSlice = createSlice({
  name: "message",
  initialState: {
    messages: [],
    isThinking: false,
    pendingPrompt: "",
    thinkingConversationId: null,
  },
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    beginThinking: (state, action) => {
      const { prompt, conversationId } = action.payload;
      state.isThinking = true;
      state.pendingPrompt = prompt;
      state.thinkingConversationId = conversationId;
    },
    completeResponse: (state, action) => {
      state.messages = action.payload;
      clearThinking(state);
    },
    cancelThinking: (state) => {
      clearThinking(state);
    },
  },
});

export const {
  setMessages,
  addMessage,
  beginThinking,
  completeResponse,
  cancelThinking,
} = messageSlice.actions;
export default messageSlice.reducer;
