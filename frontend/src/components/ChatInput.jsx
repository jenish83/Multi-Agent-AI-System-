import { Code2, FileText, Globe, Image as ImageIcon, MessageSquare, Mic, Paperclip, Presentation, Send, Zap } from "lucide-react";
import React, { useState } from "react";
import sendMessage from "../features/sendMessage";
import { createConversation } from "../features/createConversation";
import { updateConversation as saveConversationTitle } from "../features/updateConversation";
import getMessages from "../features/getMessages";
import { useDispatch, useSelector } from "react-redux";
import {
  addConversation,
  setSelectedConversation,
  updateConversation,
} from "../redux/conversationSlice";
import { setMessages } from "../redux/messageSlice";

const DEFAULT_TITLE = "New Conversation";

const isDefaultTitle = (title) =>
  !title || title.trim().toLowerCase() === DEFAULT_TITLE.toLowerCase();

const titleFromChat = (prompt) => {
  const cleaned = prompt.replace(/\s+/g, " ").trim();
  if (!cleaned) return DEFAULT_TITLE;

  const withoutTrailingPunctuation = cleaned.replace(/[?!.]+$/g, "").trim();
  const words = withoutTrailingPunctuation.split(" ").slice(0, 8);
  const snippet = words.join(" ");
  const titled = snippet.charAt(0).toUpperCase() + snippet.slice(1);

  return titled.length > 48 ? `${titled.slice(0, 45).trim()}…` : titled;
};

const ChatInput = () => {

  const [selectedAgent, setSelectedAgent] = useState("auto");
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const dispatch = useDispatch();

  const { selectedConversation } = useSelector((state) => state.conversation);
  const handleSendMessage = async () => {
    const prompt = value.trim();
    if (!prompt || sending) return;

    const payload = {
      agent: selectedAgent.toLowerCase(),
      prompt,
      conversationId: selectedConversation?._id,
    };
    let conversation = selectedConversation;

    if (!payload.conversationId) {
      conversation = await createConversation();
      if (!conversation?._id) return;
      dispatch(addConversation(conversation));
      dispatch(setSelectedConversation(conversation));
      payload.conversationId = conversation._id;
    }

    setSending(true);
    const data = await sendMessage(payload);

    setSending(false);
    if (!data) return;

    setValue("");

    if (isDefaultTitle(conversation?.title)) {
      const updated = await saveConversationTitle({
        conversationId: payload.conversationId,
        title: titleFromChat(prompt),
      });
      if (updated) {
        dispatch(updateConversation(updated));
      }
    }

    const messages = await getMessages(payload.conversationId);
    const apiImages = Array.isArray(data.images) ? data.images.filter(Boolean) : [];
    const apiFiles = Array.isArray(data.files) ? data.files.filter(Boolean) : [];
    const nextMessages = (messages || []).map((message, index, list) => {
      const isLastAssistant =
        index === list.length - 1 && message.role === "assistant";
      if (!isLastAssistant) return message;

      let next = message;
      if (!message.images?.length && apiImages.length) {
        next = { ...next, images: apiImages };
      }
      if (!message.files?.length && apiFiles.length) {
        next = { ...next, files: apiFiles };
      }
      return next;
    });
    dispatch(setMessages(nextMessages));
  };

  const agents = [ 
    {
      id: "auto",
      icon: Zap,
      label: "Auto",
      description: "Auto-generate a response based on the conversation history",
    },
    {
      id: "chat",
      icon: MessageSquare,
      label: "Chat",
      description: "Chat with the user based on the conversation history",
    },
    {
      id: "search",
      icon: Globe,
      label: "Search",
      description: "Search the web for information",
    },
    {
      id: "coding",
      icon: Code2,
      label: "Coding",
      description: "Code a response based on the conversation history",
    },
    {
      id: "pdf",
      icon: FileText,
      label: "PDF",
      description: "Read a PDF file and answer questions about it",
    },
    {
      id: "ppt",
      icon: Presentation,
      label: "PPT",
      description: "Read a PPT file and answer questions about it",
    },
    {
      id: "imageGen",
      icon: ImageIcon,
      label: "imageGen",
      description: "Generate an image based on the user request",
    }
]


  return (
    <div className="w-full shrink-0 overflow-hidden px-3 sm:px-5 py-3 sm:py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-white/[0.06] bg-[#0d0f14]">
      <div className="mx-auto w-full max-w-3xl flex flex-col gap-2 bg-white/[0.03] border border-white/[0.07] rounded-2xl px-3 sm:px-4 pt-3 pb-2.5">

      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {agents.map((agent) => {
          const isActive = selectedAgent === agent.id;
          const Icon = agent.icon;

          return (
            <button
              type="button"
              key={agent.id}
              title={agent.description}
              onClick={() => setSelectedAgent(agent.id)}
              className={`flex items-center gap-1.5 shrink-0 h-7 px-2.5 rounded-full border text-[12px] font-medium tracking-tight whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-white/[0.08] border-white/[0.12] text-slate-100"
                  : "bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] hover:border-white/[0.06]"
              }`}
            >
              <Icon size={13} className={isActive ? "text-indigo-400" : "text-slate-500"} />
              <span>{agent.label}</span>
            </button>
          )
        })}
      </div>
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
