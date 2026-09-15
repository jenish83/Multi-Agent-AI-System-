import React, { useState, useEffect } from "react";
import {
  PanelLeftIcon,
  PenSquareIcon,
  Plus,
  MessageSquare,
  User,
  LogOut,
  Coins,
  LogIn,
  Trash2,
} from "lucide-react";
import { getConversations } from "../features/getConversations";
import { createConversation } from "../features/createConversation";
import { deleteConversationById } from "../features/deleteConversation";
import { useDispatch, useSelector } from "react-redux";
import {
  setConversations,
  addConversation,
  setSelectedConversation,
  deleteConversation,
  clearConversations,
  clearSelectedConversation,
} from "../redux/conversationSlice";
import { setMessages } from "../redux/messageSlice";
import { setUserData } from "../redux/userSlice";
import logout from "../features/logout";

const iconBtnClass =
  "flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-150 bg-transparent border-none cursor-pointer";

const SideBar = ({ collapsed, onCollapsedChange }) => {
  const setCollapsed = onCollapsedChange;
  const collapseOnMobile = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setCollapsed(true);
    }
  };

  const dispatch = useDispatch();
  const [imageError, setImageError] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { conversations, selectedConversation } = useSelector(
    (state) => state.conversation,
  );
  const { userData } = useSelector((state) => state.user);
  const user = userData?.user ?? userData;

  useEffect(() => {
    const getCov = async () => {
      const data = await getConversations();
      dispatch(setConversations(data));
    };
    getCov();
  }, [userData?.user?._id]);

  const handleCreateConversation = async () => {
    try {
      const conversation = await createConversation();
      if (conversation) {
        dispatch(addConversation(conversation));
        dispatch(setSelectedConversation(conversation));
        collapseOnMobile();
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleAskDeleteConversation = (e, conv) => {
    e.stopPropagation();
    if (!conv?._id) return;
    setConversationToDelete(conv);
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setConversationToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!conversationToDelete?._id || isDeleting) return;

    setIsDeleting(true);
    const result = await deleteConversationById(conversationToDelete._id);
    setIsDeleting(false);

    if (!result) return;

    const wasSelected = selectedConversation?._id === conversationToDelete._id;
    dispatch(deleteConversation(conversationToDelete));
    if (wasSelected) {
      dispatch(setMessages([]));
    }
    setConversationToDelete(null);
  };

  useEffect(() => {
    if (!conversationToDelete) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape" && !isDeleting) {
        setConversationToDelete(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [conversationToDelete, isDeleting]);

  const handleLogout = async (e) => {
    e.stopPropagation();
    await logout();
    dispatch(setUserData(null));
    dispatch(clearConversations());
    dispatch(clearSelectedConversation());
  };

  return (
    <>
      {!collapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      <div
        className={`h-screen shrink-0 bg-[#0d0f14] border-r border-white/[0.06] overflow-hidden transition-[width,transform] duration-300 ease-out
          max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:w-[256px]
          ${collapsed ? "w-[72px] max-lg:-translate-x-full max-lg:pointer-events-none" : "w-[256px] max-lg:translate-x-0"}`}
      >
        <div className="flex flex-col h-full">
          <div
            className={`flex items-center border-b border-white/[0.06] py-4 ${
              collapsed ? "justify-center px-2" : "gap-2.5 px-4"  
            }`}
          >
            <button
              type="button"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={iconBtnClass}
              onClick={() => setCollapsed((prev) => !prev)}
            >
              <PanelLeftIcon
                size={20}
                className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
              />
            </button>

            {!collapsed && (
              <>
                <span className="text-[16px] font-semibold text-slate-100 tracking-tight flex-1 truncate">
                  NexoraAI
                </span>

                <span className="text-[12px] font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full tracking-wide">
                  free
                </span>

                <button
                  type="button"
                  aria-label="New chat"
                  className={iconBtnClass}
                  onClick={handleCreateConversation}
                >
                  <PenSquareIcon size={20} />
                </button>
              </>
            )}
          </div>

          <div className={`${collapsed ? "px-2 pt-3 pb-1" : "px-4 pt-4 pb-1"}`}>
            <button
              type="button"
              aria-label="New Chat"
              className={`flex items-center justify-center gap-2 text-sm font-medium text-white bg-linear-to-br from-indigo-500 to-violet-700 border-none cursor-pointer hover:opacity-90 transition-opacity duration-150 ${
                collapsed
                  ? "w-9 h-9 mx-auto rounded-xl"
                  : "w-full rounded-xl py-[10px]"
              }`}
              onClick={handleCreateConversation}
            >
              <Plus size={16} />
              {!collapsed && "New Chat"}
            </button>
          </div>

          {!collapsed &&
            (conversations.length === 0 ? (
              <div className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                No Recent Conversations
              </div>
            ) : (
              <div className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Recent Conversations
              </div>
            ))}

          <div
            className={`flex-1 overflow-y-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
              collapsed ? "px-2 pt-2" : "px-2.5"
            }`}
          >
            {conversations.map((conv) => {
              const isActive = selectedConversation?._id === conv?._id;
              const title = conv?.title || "New Chat";

              return (
                <div
                  key={conv?._id}
                  title={title}
                  onClick={() => {
                    dispatch(setSelectedConversation(conv));
                    collapseOnMobile();
                  }}
                  className={`group flex items-center cursor-pointer mb-px rounded-lg border transition-colors duration-150
                    ${collapsed ? "justify-center px-0 py-1.5" : "gap-2 px-2 py-1.5"}
                    ${
                      isActive
                        ? "bg-indigo-500/10 border-indigo-500/20"
                        : "bg-transparent border-transparent hover:bg-white/[0.04]"
                    }`}
                >
                  <div
                    className={`flex items-center justify-center shrink-0 w-5 h-5 rounded-md transition-colors duration-150
                      ${
                        isActive
                          ? "bg-indigo-500/15 text-indigo-400"
                          : "bg-transparent text-slate-500"
                      }`}
                  >
                    <MessageSquare size={12} />
                  </div>

                  {!collapsed && (
                    <>
                      <span
                        className={`text-[12px] font-medium truncate leading-none flex-1 ${
                          isActive ? "text-slate-100" : "text-slate-400"
                        }`}
                      >
                        {title}
                      </span>
                      <button
                        type="button"
                        aria-label="Delete conversation"
                        title="Delete conversation"
                        className={`flex items-center justify-center w-6 h-6 rounded-md border-none bg-transparent text-slate-600 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-all duration-150 shrink-0 ${
                          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                        onClick={(e) => handleAskDeleteConversation(e, conv)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="shrink-0 mt-auto">
            <div className="mx-2.5 h-px bg-white/[0.06]" />
            <div className={`${collapsed ? "px-2 py-2.5" : "px-3.5 py-2.5"} text-[13px] text-slate-300`}>
              {user ? (
                <div
                  className={`flex items-center rounded-xl transition-colors duration-150 ${
                    collapsed
                      ? "flex-col gap-2 px-0 py-1.5"
                      : "gap-2 px-3 py-2.5 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="relative shrink-0">
                    {user?.avatar && !imageError ? (
                      <img
                        className="w-9 h-9 rounded-[10px] object-cover border-2 border-indigo-500/25"
                        src={user?.avatar}
                        alt={user?.name || "User"}
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-[10px] bg-white/[0.06] flex items-center justify-center">
                        <User size={20} />
                      </div>
                    )}
                  </div>

                  {!collapsed && (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-semibold text-slate-100 truncate">
                          {user?.name || "User"}
                        </p>
                        <p className="text-[10.5px] text-slate-600 mt-px">
                          Free Plan
                        </p>
                      </div>

                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="flex items-center justify-center w-7 h-7 rounded-[7px] border-none bg-transparent text-yellow-600 cursor-pointer hover:bg-white/[0.08] hover:text-slate-400 transition-all duration-150"
                        >
                          <Coins size={16} />
                        </button>

                        <button
                          type="button"
                          className="flex items-center justify-center w-7 h-7 rounded-[7px] border-none bg-transparent text-slate-600 cursor-pointer hover:bg-white/[0.08] hover:text-slate-400 transition-all duration-150"
                          onClick={handleLogout}
                        >
                          <LogOut size={16} />
                        </button>
                      </div>
                    </>
                  )}

                  {collapsed && (
                    <button
                      type="button"
                      aria-label="Logout"
                      className="flex items-center justify-center w-7 h-7 rounded-[7px] border-none bg-transparent text-slate-600 cursor-pointer hover:bg-white/[0.08] hover:text-slate-400 transition-all duration-150"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                    </button>
                  )}
                </div>
              ) : collapsed ? (
                <button
                  type="button"
                  aria-label="Login"
                  className="flex items-center justify-center w-9 h-9 mx-auto text-white bg-linear-to-br from-indigo-500 to-violet-700 rounded-xl border-none cursor-pointer hover:opacity-90 transition-opacity duration-150"
                >
                  <LogIn size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 text-sm font-medium text-white bg-linear-to-br from-indigo-500 to-violet-700 rounded-xl py-[10px] border-none cursor-pointer hover:opacity-90 transition-opacity duration-150"
                >
                  <LogIn size={16} />
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {conversationToDelete && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-[2px] px-4"
          onClick={handleCancelDelete}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-conversation-title"
            className="w-full max-w-[320px] rounded-2xl border border-white/[0.08] bg-[#141821] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/10 text-red-400 mb-3">
              <Trash2 size={18} />
            </div>
            <h3
              id="delete-conversation-title"
              className="text-[15px] font-semibold text-slate-100"
            >
              Delete conversation?
            </h3>
            <p className="mt-1.5 text-[13px] leading-5 text-slate-400">
              Are you sure you want to delete{" "}
              <span className="text-slate-200 font-medium">
                “{conversationToDelete.title || "New Conversation"}”
              </span>
              ? This can’t be undone.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] py-2 text-[13px] font-medium text-slate-300 cursor-pointer hover:bg-white/[0.08] transition-colors duration-150"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl border-none bg-red-500 py-2 text-[13px] font-medium text-white cursor-pointer hover:bg-red-600 transition-colors duration-150 disabled:opacity-60"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SideBar;
