import { Mail, Users } from "lucide-react";
import type { Chat } from "../types/chat";
import type { User as UserType } from "../types/user";
import { getUserInitial } from "../utils/userDisplay";

interface ChatListItemProps {
  chat: Chat;
  otherUser: UserType | undefined;
  isOnline: boolean;
  isSelected: boolean;
  unreadCount: number;
  onClick: () => void;
}

export default function ChatListItem({
  chat,
  otherUser,
  isOnline,
  isSelected,
  unreadCount,
  onClick,
}: ChatListItemProps) {
  const displayName = chat.isGroupChat ? chat.groupName : otherUser?.name || "Unknown User";
  const initial = getUserInitial(displayName);

  return (
    <div
      onClick={onClick}
      className={`group relative flex h-18 cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-150 ${
        isSelected
          ? "border-l-4 border-[#25d366] bg-[#faf2ea] shadow-sm"
          : "hover:bg-[#f4ede5]"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="relative shrink-0">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold shadow-sm ${
              chat.isGroupChat ? "bg-[#006d2f] text-white" : "bg-[#e8e1d9] text-[#1e1b17]"
            }`}
          >
            {initial}
          </div>

          {!chat.isGroupChat && isOnline && (
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#25d366]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center justify-between">
            <h3 className="truncate text-sm font-semibold text-[#1e1b17]">{displayName}</h3>
          </div>

          {chat.isGroupChat ? (
            <p className="flex items-center gap-1 truncate text-xs text-[#6c7b6b]">
              <Users className="h-3.5 w-3.5 text-[#6c7b6b]" /> Group Chat
            </p>
          ) : (
            <p className="flex items-center gap-1 truncate text-xs text-[#6c7b6b]">
              <Mail className="h-3.5 w-3.5 text-[#6c7b6b]" /> {otherUser?.email}
            </p>
          )}
        </div>
      </div>

      <div className="ml-2 flex shrink-0 flex-col items-end gap-1">
        {unreadCount > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#25d366] px-1.5 text-[11px] font-bold text-[#005523] shadow-sm">
            {unreadCount}
          </span>
        ) : (
          !chat.isGroupChat && (
            <span
              className={`flex items-center gap-1 text-[10px] font-medium ${
                isOnline ? "text-[#006d2f]" : "text-[#6c7b6b]"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-[#006d2f]" : "bg-[#6c7b6b]"}`}
              />
              {isOnline ? "Online" : "Offline"}
            </span>
          )
        )}
      </div>
    </div>
  );
}