import { MessageSquare, PanelLeftIcon } from "lucide-react";
import React from "react";
import { useSelector } from "react-redux";

const Nav = ({ onToggleSidebar }) => {
  const { selectedConversation } = useSelector((state) => state.conversation);
  const { messages } = useSelector((state) => state.message);

  return (
    <div className="h-14 shrink-0 flex items-center gap-2 sm:gap-2.5 px-3 sm:px-5 border-b border-white/[0.06] bg-[#0d0f14]">
      <button
        type="button"
        aria-label="Open sidebar"
        onClick={onToggleSidebar}
        className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] border-none bg-transparent cursor-pointer shrink-0"
      >
        <PanelLeftIcon size={18} />
      </button>

      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 shrink-0">
        <MessageSquare size={13} className="text-indigo-400" />
      </div>

      <div className="text-[14px] font-semibold text-slate-100 tracking-tight truncate min-w-0">
        {selectedConversation?.title || "New Chat"}
      </div>

      {selectedConversation && (
        <div className="text-[10px] font-medium text-slate-600 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full shrink-0">
          {messages?.length} Messages
        </div>
      )}
    </div>
  );
};

export default Nav;
