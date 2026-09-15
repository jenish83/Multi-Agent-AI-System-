import React from "react";
import Markdown from "react-markdown";

const MessageBubble = ({ role, content }) => {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] sm:max-w-[80%] min-w-0 rounded-2xl px-3.5 py-2.5 sm:px-4 text-[14px] leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? "bg-indigo-500/20 text-slate-100 border border-indigo-400/20"
            : "bg-white/[0.04] text-slate-200 border border-white/[0.06]"
        }`}
      >
        <Markdown>{content}</Markdown>
      </div>
    </div>
  );
};

export default MessageBubble;
