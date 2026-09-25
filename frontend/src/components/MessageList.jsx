import React from "react";
import { useSelector } from "react-redux";
import MessageBubble from "./MessageBubble";

const MessageList = () => {
  const { selectedConversation } = useSelector((state) => state.conversation);
  const { messages } = useSelector((state) => state.message);

  const isEmpty = messages.length === 0 || !selectedConversation;

  return (
    <div
      className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6
        [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {isEmpty ? (
        <div className="h-full min-h-full flex items-center justify-center">
          <div className="flex flex-col items-center text-center gap-2 px-2 max-w-md">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight bg-linear-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              NexoraAI
            </h1>
            <p className="text-[15px] sm:text-[16px] font-medium text-slate-400 tracking-tight">
              How can i help you today?
            </p>
            <p className="text-[13px] sm:text-[14px] font-medium text-slate-400 tracking-tight">
              Ask me anything - code, ideas, explaination, or just a quick
              question.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              {[
                "Built a Simple Calculator",
                "Explain the concept of React",
                "How to create a simple todo list",
              ].map((s) => (
                <button
                  key={s}
                  type="button"
                  className="px-3 sm:px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] text-[12px] sm:text-[13px] font-medium text-slate-400 tracking-tight hover:bg-white/[0.06] hover:text-slate-300 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-3xl flex flex-col gap-4 sm:gap-5 pb-2">
          {messages.map((message) => {
            return (
              <MessageBubble
                key={message._id}
                role={message.role}
                content={message.content}
                images={message.images || []}
                files={message.files || []}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MessageList;
