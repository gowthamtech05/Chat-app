import {
  Bell,
  CircleDashed,
  MessageSquare,
  MessageSquareOff,
  MoreHorizontal,
  Search,
  SquarePen,
  Users,
  X,
} from "lucide-react";
import type { Chat } from "../types/chat";
import type { User as UserType } from "../types/user";
import type { FilterType } from "../types/navigation";
import ChatListItem from "../components/ChatListItem";

interface ChatsPageProps {
  chats: Chat[];
  loadingChats: boolean;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  activeFilter: FilterType;
  setActiveFilter: (value: FilterType) => void;
  filteredChats: Chat[];
  getOtherUser: (chat: Chat) => UserType | undefined;
  markChatRead: (chatId: string) => void;
  selectedChat: Chat | null;
  setSelectedChat: (chat: Chat) => void;
  currentUser: UserType | null | undefined;
  onlineUsers: string[];
}

export default function ChatsPage({
  chats,
  loadingChats,
  searchTerm,
  setSearchTerm,
  activeFilter,
  setActiveFilter,
  filteredChats,
  getOtherUser,
  markChatRead,
  selectedChat,
  setSelectedChat,
  currentUser,
  onlineUsers,
}: ChatsPageProps) {
  const handleChatClick = (chat: Chat) => {
    setSelectedChat(chat);
    markChatRead(chat._id);
  };

  return (
    <>
      <div className="flex items-center justify-between px-4 pb-3 pt-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-[#1e1b17]">Chats</h1>
          <span className="rounded-full bg-[#25d366]/15 px-2.5 py-0.5 text-xs font-semibold text-[#006d2f]">
            {chats.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#3c4a3d] transition-colors hover:bg-[#f4ede5]"
            aria-label="More options"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25d366] text-[#005523] shadow-sm transition-all hover:bg-[#20bd5c] active:scale-95"
            aria-label="New chat"
          >
            <SquarePen className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="relative flex w-full items-center">
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-[#6c7b6b]" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-full border border-transparent bg-[#f4ede5] py-2 pl-10 pr-10 text-sm text-[#1e1b17] placeholder-[#6c7b6b] outline-none transition-all focus:border-[#25d366] focus:bg-white focus:ring-2 focus:ring-[#25d366]/20"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#6c7b6b]/20 text-[#1e1b17] hover:bg-[#6c7b6b]/40"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto px-4 pb-3">
        <button
          onClick={() => setActiveFilter("all")}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
            activeFilter === "all"
              ? "bg-[#a5ede0] text-[#005047]"
              : "bg-[#f4ede5] text-[#3c4a3d] hover:bg-[#eee7df]"
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          All
        </button>
        <button
          onClick={() => setActiveFilter("unread")}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
            activeFilter === "unread"
              ? "bg-[#a5ede0] text-[#005047]"
              : "bg-[#f4ede5] text-[#3c4a3d] hover:bg-[#eee7df]"
          }`}
        >
          <Bell className="h-3.5 w-3.5" />
          Unread
        </button>
        <button
          onClick={() => setActiveFilter("groups")}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
            activeFilter === "groups"
              ? "bg-[#a5ede0] text-[#005047]"
              : "bg-[#f4ede5] text-[#3c4a3d] hover:bg-[#eee7df]"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          Groups
        </button>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-2">
        {loadingChats ? (
          <div className="flex h-40 flex-col items-center justify-center text-xs text-[#6c7b6b]">
            <CircleDashed className="mb-2 h-6 w-6 animate-spin text-[#25d366]" />
            Loading chats...
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-sm text-[#6c7b6b]">
            <MessageSquareOff className="mb-2 h-8 w-8 opacity-50" />
            No conversations found
          </div>
        ) : (
          filteredChats.map((chat) => {
            const otherUser = getOtherUser(chat);
            const isOnline = Boolean(otherUser && onlineUsers.includes(otherUser._id));
            const unreadCount = currentUser ? chat.unreadCounts?.[currentUser._id] || 0 : 0;

            return (
              <ChatListItem
                key={chat._id}
                chat={chat}
                otherUser={otherUser}
                isOnline={isOnline}
                isSelected={selectedChat?._id === chat._id}
                unreadCount={unreadCount}
                onClick={() => handleChatClick(chat)}
              />
            );
          })
        )}
      </div>
    </>
  );
}