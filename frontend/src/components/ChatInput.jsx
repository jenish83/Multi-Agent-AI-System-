import { Code2, Coins, FileText, Globe, Image as ImageIcon, MessageSquare, Mic, Paperclip, Presentation, Send, X, Zap } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import sendMessage from "../features/sendMessage";
import { createConversation } from "../features/createConversation";
import { updateConversation as saveConversationTitle } from "../features/updateConversation";
import getMessages from "../features/getMessages";
import getCurrentUser from "../features/getCurrentUser";
import { useDispatch, useSelector } from "react-redux";
import {
  addConversation,
  setSelectedConversation,
  updateConversation,
} from "../redux/conversationSlice";
import {
  beginThinking,
  cancelThinking,
  completeResponse,
} from "../redux/messageSlice";
import { setUserData } from "../redux/userSlice";

const DEFAULT_TITLE = "New Conversation";
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

const isAllowedUpload = (file) =>
  file.type === "application/pdf" || file.type.startsWith("image/");

const defaultPromptForFile = (file) =>
  file.type === "application/pdf" ? "Summarize this PDF" : "Analyze this image";

const isDefaultTitle = (title) =>
  !title || title.trim().toLowerCase() === DEFAULT_TITLE.toLowerCase();

const isInsufficientCreditsError = (error) => {
  const status = error?.response?.status;
  const code = error?.response?.data?.code;
  return status === 402 || code === "INSUFFICIENT_CREDITS";
};

const isRateLimitError = (error) => {
  const status = error?.response?.status;
  const code = error?.response?.data?.code;
  const message = error?.response?.data?.message || "";
  return (
    status === 429 ||
    code === "RATE_LIMIT_EXCEEDED" ||
    /maximum number of requests|rate limit exceeded/i.test(message)
  );
};

const rateLimitMessage = (error) =>
  error?.response?.data?.message ||
  "You have reached the maximum number of requests for this agent. Please try again later.";

const titleFromChat = (prompt) => {
  const cleaned = prompt.replace(/\s+/g, " ").trim();
  if (!cleaned) return DEFAULT_TITLE;

  const withoutTrailingPunctuation = cleaned.replace(/[?!.]+$/g, "").trim();
  const words = withoutTrailingPunctuation.split(" ").slice(0, 8);
  const snippet = words.join(" ");
  const titled = snippet.charAt(0).toUpperCase() + snippet.slice(1);

  return titled.length > 48 ? `${titled.slice(0, 45).trim()}…` : titled;
};

const ChatInput = ({ onOpenBilling }) => {

  const [selectedAgent, setSelectedAgent] = useState("auto");
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileError, setFileError] = useState("");
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [sendError, setSendError] = useState("");
  const fileInputRef = useRef(null);
  const selectedConversationIdRef = useRef(null);
  const dispatch = useDispatch();

  const { selectedConversation } = useSelector((state) => state.conversation);
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversation?._id ?? null;
  }, [selectedConversation?._id]);

  useEffect(() => {
    if (!selectedFile?.type?.startsWith("image/")) {
      setPreviewUrl("");
      return undefined;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!isAllowedUpload(file)) {
      setSelectedFile(null);
      setFileError("Choose a PDF or an image file.");
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setSelectedFile(null);
      setFileError("File must be 20 MB or smaller.");
      return;
    }

    setFileError("");
    setSelectedFile(file);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFileError("");
  };

  const handleSendMessage = async () => {
    const typedPrompt = value.trim();
    const file = selectedFile;
    if (sending || (!typedPrompt && !file)) return;

    const prompt = typedPrompt || defaultPromptForFile(file);
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
    setSendError("");
    dispatch(
      beginThinking({
        prompt,
        conversationId: payload.conversationId,
      }),
    );
    setValue("");
    clearSelectedFile();

    let data;
    try {
      if (file) {
        const formData = new FormData();
        formData.append("agent", payload.agent);
        formData.append("prompt", payload.prompt);
        formData.append("conversationId", payload.conversationId);
        formData.append("file", file);
        data = await sendMessage(formData);
      } else {
        data = await sendMessage(payload);
      }
    } catch (error) {
      setSending(false);
      if (isRateLimitError(error)) {
        const notice = rateLimitMessage(error);
        try {
          const messages = await getMessages(payload.conversationId);
          const list = Array.isArray(messages) ? messages : [];
          const last = list[list.length - 1];
          const nextMessages =
            last?.role === "assistant" && last?.content === notice
              ? list
              : [
                  ...list,
                  {
                    _id: `rate-limit-${Date.now()}`,
                    role: "assistant",
                    content: notice,
                    images: [],
                    files: [],
                  },
                ];
          if (selectedConversationIdRef.current === payload.conversationId) {
            dispatch(completeResponse(nextMessages));
          } else {
            dispatch(cancelThinking());
          }
        } catch (loadError) {
          dispatch(cancelThinking());
          setSendError(notice);
          console.error(loadError);
        }
        return;
      }
      dispatch(cancelThinking());
      setValue(typedPrompt);
      if (file) setSelectedFile(file);
      if (isInsufficientCreditsError(error)) {
        setShowCreditsModal(true);
        return;
      }
      const status = error.response?.status;
      if (status === 504 || error.code === "ECONNABORTED") {
        setSendError(
          "The request timed out. Search and coding can take up to a minute — please try again.",
        );
      } else {
        setSendError(
          error.response?.data?.message ||
            "Something went wrong while sending your message. Please try again.",
        );
      }
      console.error(error);
      return;
    }

    setSending(false);
    if (!data) {
      dispatch(cancelThinking());
      setValue(typedPrompt);
      if (file) setSelectedFile(file);
      return;
    }

    if (isDefaultTitle(conversation?.title)) {
      const updated = await saveConversationTitle({
        conversationId: payload.conversationId,
        title: titleFromChat(prompt),
      });
      if (updated) {
        dispatch(updateConversation(updated));
      }
    }

    const [messages, freshUser] = await Promise.all([
      getMessages(payload.conversationId),
      getCurrentUser(),
    ]);
    if (freshUser && typeof freshUser.credits === "number") {
      const base = userData?.user ?? userData ?? {};
      dispatch(
        setUserData({
          ...base,
          credits: freshUser.credits,
          totalCredits: freshUser.totalCredits ?? base.totalCredits,
          plan: freshUser.plan ?? base.plan,
          planExpiersAt: freshUser.planExpiersAt ?? base.planExpiersAt,
        }),
      );
    }
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

    if (selectedConversationIdRef.current === payload.conversationId) {
      dispatch(completeResponse(nextMessages));
    } else {
      dispatch(cancelThinking());
    }
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


  const handlePromptKeyDown = (event) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    handleSendMessage();
  };

  const handleCloseCreditsModal = () => setShowCreditsModal(false);

  const handleBuyCredits = () => {
    setShowCreditsModal(false);
    onOpenBilling?.();
  };

  return (
    <>
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
          onKeyDown={handlePromptKeyDown}
          value={value}
          placeholder={selectedFile ? "Ask about this file..." : "Ask Anything..."}
          className="w-full bg-transparent outline-none resize-none text-[14px] text-slate-200 placeholder:text-slate-600 leading-relaxed min-h-[44px] sm:min-h-[64px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden disabled:opacity-50"
          rows={2}
          disabled={sending}
        />
        {selectedFile && (
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-2 py-1.5">
            {previewUrl ? (
              <img src={previewUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 border border-indigo-400/20">
                <FileText size={16} className="text-indigo-300" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-slate-200">{selectedFile.name}</p>
              <p className="text-[11px] text-slate-500">
                {selectedFile.type === "application/pdf" ? "PDF" : "Image"}
              </p>
            </div>
            <button
              type="button"
              onClick={clearSelectedFile}
              disabled={sending}
              aria-label="Remove file"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-50"
            >
              <X size={14} />
            </button>
          </div>
        )}
        {fileError && (
          <p className="text-[12px] text-rose-400">{fileError}</p>
        )}
        {sendError && (
          <p className="text-[12px] text-rose-400">{sendError}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              aria-label="Upload PDF or image"
              title="Upload PDF or image"
              className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-150 bg-transparent cursor-pointer disabled:opacity-50 ${
                selectedFile
                  ? "text-indigo-300 border-indigo-400/30 bg-indigo-500/10"
                  : "text-slate-600 hover:text-slate-400 hover:bg-white/[0.05] border-transparent hover:border-white/[0.06]"
              }`}
            >
              <Paperclip size={16} />
            </button>

            <button className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-all duration-150 bg-transparent cursor-pointer">
              <Mic size={16} />
            </button>
          </div>
            <button
            type="button"
            onClick={handleSendMessage}
            disabled={(!value.trim() && !selectedFile) || sending}
            className={`px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] text-[13px] font-medium text-slate-400 tracking-tight hover:bg-white/[0.06] hover:text-slate-300 transition-colors ${(!value.trim() && !selectedFile) || sending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
              <Send size={16} className={`text-slate-400 ${(!value.trim() && !selectedFile) || sending ? "opacity-50" : ""}`} />
            </button>
        </div>
      </div>
    </div>

    {showCreditsModal && (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-[2px] px-4"
        onClick={handleCloseCreditsModal}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="insufficient-credits-title"
          className="w-full max-w-[320px] rounded-2xl border border-white/[0.08] bg-[#141821] p-5 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 mb-3">
            <Coins size={18} />
          </div>
          <h3
            id="insufficient-credits-title"
            className="text-[15px] font-semibold text-slate-100"
          >
            Insufficient credits
          </h3>
          <p className="mt-1.5 text-[13px] leading-5 text-slate-400">
            You do not have enough credits for this request. Buy credits to continue.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] py-2 text-[13px] font-medium text-slate-300 cursor-pointer hover:bg-white/[0.08] transition-colors duration-150"
              onClick={handleCloseCreditsModal}
            >
              Close
            </button>
            <button
              type="button"
              className="flex-1 rounded-xl border-none bg-amber-500 py-2 text-[13px] font-medium text-white cursor-pointer hover:bg-amber-600 transition-colors duration-150"
              onClick={handleBuyCredits}
            >
              Buy credits
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default ChatInput;
