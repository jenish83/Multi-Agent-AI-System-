import express from 'express';
import { createConversation, deleteConversation, getConversations, getMessages, saveMessage, updateConversation } from '../controller/chat.controller.js';

const   router = express.Router();

router.get('/create-conversation', createConversation);
router.get('/get-conversations', getConversations);
router.post('/update-conversation', updateConversation);
router.post('/save-message', saveMessage);
router.get('/get-messages/:conversationId', getMessages);
router.delete('/delete-conversation/:conversationId', deleteConversation);


export default router;