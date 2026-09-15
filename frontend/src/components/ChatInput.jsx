import { Mic, Paperclip, Send } from "lucide-react";
import React, { useState } from "react";
import sendMessage from "../features/sendMessage";
import { createConversation } from "../features/createConversation";
import getMessages from "../features/getMessages";
import { useDispatch, useSelector } from "react-redux";
import {
  addConversation,
  setSelectedConversation,
} from "../redux/conversationSlice";
import { setMessages } from "../redux/messageSlice";

const ChatInput = () => {

  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const dispatch = useDispatch();

  const { selectedConversation } = useSelector((state) => state.conversation);
  const handleSendMessage = async () => {
    const prompt = value.trim();
    if (!prompt || sending) return;

    const payload = {
      prompt,
      conversationId: selectedConversation?._id,
    }
    if (!payload.conversationId) {
      const conversation = await createConversation();
      if (!conversation?._id) return;
      dispatch(addConversation(conversation));
      dispatch(setSelectedConversation(conversation));
      payload.conversationId = conversation._id;
    }

    setSending(true);
    const data = await sendMessage(payload || {});
    setSending(false);
    if (!data) return;

    setValue("");
    const messages = await getMessages(payload.conversationId);
    dispatch(setMessages(messages || []));
  }


  return (
    <div className="w-full shrink-0 overflow-hidden px-3 sm:px-5 py-3 sm:py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-white/[0.06] bg-[#0d0f14]">
      <div className="mx-auto w-full max-w-3xl flex flex-col gap-2 bg-white/[0.03] border border-white/[0.07] rounded-2xl px-3 sm:px-4 pt-3 pb-2.5">
        <textarea
          onChange={ (e) => setValue(e.target.value) }
          value={value}
          placeholder="Ask Anything..."
          className="w-full bg-transparent outline-none resize-none text-[14px] text-slate-200 placeholder:text-slate-600 leading-relaxed min-h-[44px] sm:min-h-[64px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden disabled:opacity-50"
          rows={2}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-all duration-150 bg-transparent cursor-pointer">
              <Paperclip size={16} />
            </button>

            <button className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-all duration-150 bg-transparent cursor-pointer">
              <Mic size={16} />
            </button>
          </div>
            <button 
            onClick={handleSendMessage}
            disabled={!value.trim() || sending}
            className={`px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] text-[13px] font-medium text-slate-400 tracking-tight hover:bg-white/[0.06] hover:text-slate-300 transition-colors ${!value.trim() || sending ? "opacity-50 cursor-not-allowed" : ""}`}>
              <Send size={16} className={`text-slate-400 ${!value.trim() || sending ? "opacity-50" : ""}`} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
