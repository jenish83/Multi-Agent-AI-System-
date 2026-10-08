import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import MessageBubble from "./MessageBubble";
import LoadingAnimation from "./LoadingAnimation";

const MessageList = () => {
  const { selectedConversation } = useSelector((state) => state.conversation);
  const { messages, isThinking, pendingPrompt, thinkingConversationId } =
    useSelector((state) => state.message);
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const prevConversationIdRef = useRef(null);
  const [fadeInMessageId, setFadeInMessageId] = useState(null);
  const [wasThinking, setWasThinking] = useState(false);

  const showThinking =
    isThinking &&
    thinkingConversationId === selectedConversation?._id &&
    Boolean(pendingPrompt);

  const isEmpty =
    (messages.length === 0 || !selectedConversation) && !showThinking;

  if (wasThinking !== showThinking) {
    setWasThinking(showThinking);
    if (wasThinking && !showThinking) {
      const lastAssistant = [...messages]
        .reverse()
        .find((message) => message.role === "assistant");
      if (lastAssistant?._id) {
        setFadeInMessageId(lastAssistant._id);
      }
    }
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isEmpty) return;

    const conversationChanged =
      prevConversationIdRef.current !== selectedConversation?._id;
    prevConversationIdRef.current = selectedConversation?._id ?? null;

    const behavior = conversationChanged ? "auto" : "smooth";

    const frame = requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [
    messages,
    showThinking,
    pendingPrompt,
    selectedConversation?._id,
    isEmpty,
  ]);

  return (
    <div
      ref={containerRef}
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
          {messages.map((message) => (
            <div
              key={message._id}
              className={
                message._id === fadeInMessageId ? "reply-fade-in" : undefined
              }
              onAnimationEnd={() => {
                if (message._id === fadeInMessageId) {
                  setFadeInMessageId(null);
                }
              }}
            >
              <MessageBubble
                role={message.role}
                content={message.content}
                images={message.images || []}
                files={message.files || []}
              />
            </div>
          ))}

          {showThinking && (
            <>
              <MessageBubble
                role="user"
                content={pendingPrompt}
                images={[]}
                files={[]}
              />
              <div className="flex justify-start">
                <LoadingAnimation />
              </div>
            </>
          )}

          <div ref={bottomRef} aria-hidden="true" />
        </div>
      )}
    </div>
  );
};

export default MessageList;
