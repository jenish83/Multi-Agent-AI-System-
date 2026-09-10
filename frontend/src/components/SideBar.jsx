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
} from "lucide-react";
import { getConversations } from "../features/getConversations";
import { createConversation } from "../features/createConversation";
import { useDispatch, useSelector } from "react-redux";
import {
  setConversations,
  addConversation,
  setSelectedConversation,
  clearConversations,
  clearSelectedConversation,
} from "../redux/conversationSlice";
import { setUserData } from "../redux/userSlice";
import logout from "../features/logout";

const iconBtnClass =
  "flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-150 bg-transparent border-none cursor-pointer";

const SideBar = () => {
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1024 : false,
  );

  const dispatch = useDispatch();
  const [imageError, setImageError] = useState(false);
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
      }
    } catch (err) {
      console.log(err);
    }
  };

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
        className={`h-screen shrink-0 bg-[#0d0f14] border-r border-white/[0.06] overflow-hidden transition-[width] duration-300 ease-out
          max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50
          ${collapsed ? "w-[72px]" : "w-[256px]"}`}
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
                  onClick={() => dispatch(setSelectedConversation(conv))}
                  className={`flex items-center cursor-pointer mb-px rounded-lg border transition-colors duration-150
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
                    <span
                      className={`text-[12px] font-medium truncate leading-none ${
                        isActive ? "text-slate-100" : "text-slate-400"
                      }`}
                    >
                      {title}
                    </span>
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
    </>
  );
};

export default SideBar;
