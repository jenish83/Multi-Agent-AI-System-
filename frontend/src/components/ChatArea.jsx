import React, { useEffect } from "react";
import Nav from "./Nav";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import getMessages from "../features/getMessages";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { setMessages } from "../redux/messageSlice";

const ChatArea = ({ onToggleSidebar }) => {

  const { selectedConversation } = useSelector((state) => state.conversation);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!selectedConversation?._id) {
      dispatch(setMessages([]));
      return;
    }

    const fetchMessages = async () => {
      const messages = await getMessages(selectedConversation._id);
      dispatch(setMessages(messages || []));
    };

    fetchMessages();
  }, [selectedConversation?._id, dispatch]);
  return (
    <div className="flex-1 min-w-0 min-h-0 h-full flex flex-col">
      <Nav onToggleSidebar={onToggleSidebar} />
      <MessageList/>
      <ChatInput/>
    </div>
  );
};

export default ChatArea;
