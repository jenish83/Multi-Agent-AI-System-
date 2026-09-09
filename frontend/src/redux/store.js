import { configureStore } from '@reduxjs/toolkit'
import userReducer from './userSlice';
import conversationReducer from './conversationSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    conversation: conversationReducer,
  },
})