import { useState } from "react";
import { useSelector, useDispatch as useReduxDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Sparkles, Megaphone, Settings, Users } from "lucide-react";
import socket from "../socket";
import { logout as logoutAction } from "../features/auth/authSlice";
import UserProfileModal from "./UserProfileModal";
import { useChats } from "../hooks/useChats";
import { useFriendRequests } from "../hooks/useFriendRequests";
import { useStatuses } from "../hooks/useStatuses";
import { getUserInitial } from "../utils/userDisplay";
import ChatsPage from "../pages/ChatsPage";
import StatusPage from "../pages/StatusPage";
import ChannelsPage from "../pages/ChannelsPage";
import AddFriendPage from "../pages/AddFriendPage";
import SettingsPage from "../pages/SettingsPage";
import type { RootState, AppDispatch } from "../app/store";
import type { Chat } from "../types/chat";
import type { NavTabType } from "../types/navigation";

interface SidebarProps {
  selectedChat: Chat | null;
  setSelectedChat: (chat: Chat) => void;
}

const NAV_ITEMS: { tab: NavTabType; label: string; icon: typeof MessageSquare }[] = [
  { tab: "chats", label: "Chats", icon: MessageSquare },
  { tab: "status", label: "Status", icon: Sparkles },
  { tab: "channels", label: "Post", icon: Megaphone },
  { tab: "add-friend", label: "Add Friend", icon: Users },
];

const ACTIVE_TAB_STORAGE_KEY = "whatsapp-clone:activeNavTab";
const VALID_NAV_TABS: NavTabType[] = ["chats", "status", "channels", "add-friend", "settings"];

function isNavTabType(value: string | null): value is NavTabType {
  return value !== null && (VALID_NAV_TABS as string[]).includes(value);
}

function getInitialNavTab(): NavTabType {
  if (typeof window === "undefined") return "chats";
  const stored = window.localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
  return isNavTabType(stored) ? stored : "chats";
}

export default function Sidebar({ selectedChat, setSelectedChat }: SidebarProps) {
  const navigate = useNavigate();
  const dispatch = useReduxDispatch<AppDispatch>();

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const onlineUsers = useSelector((state: RootState) => state.chat.onlineUsers) || [];

  const [activeNavTab, setActiveNavTabState] = useState<NavTabType>(getInitialNavTab);

  const setActiveNavTab = (tab: NavTabType) => {
    setActiveNavTabState(tab);
    try {
      window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
    } catch (err) {
      console.error("Failed to persist active nav tab:", err);
    }
  };

  const chatsState = useChats(currentUser);
  const friendState = useFriendRequests({ onFriendAccepted: chatsState.loadChats });
  const statusesState = useStatuses();
  const hasUnviewedStatuses = statusesState.recentGroups.length > 0;

  const handleLogout = () => {
    socket.disconnect();
    dispatch(logoutAction());
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex h-full w-full select-none overflow-hidden bg-[#fff8f1]">
      <nav className="hidden h-full w-20 shrink-0 flex-col items-center justify-between border-r border-[#bbcbb9]/40 bg-[#faf2ea] py-4 md:flex">
        <div className="flex w-full flex-col items-center space-y-4 px-2">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25d366] text-[#005523] shadow-sm">
            <MessageSquare className="h-6 w-6 fill-[#005523]" />
          </div>

          {NAV_ITEMS.map(({ tab, label, icon: Icon }) => (
            <button
              key={tab}
              onClick={() => setActiveNavTab(tab)}
              className={`group relative flex w-full flex-col items-center justify-center rounded-xl py-2.5 transition-all ${
                activeNavTab === tab
                  ? "bg-[#a5ede0] font-bold text-[#006d2f]"
                  : "text-[#3c4a3d] hover:bg-[#eee7df]"
              }`}
              title={label}
            >
              <div className="relative">
                <Icon className="mb-1 h-5 w-5" />
                {tab === "add-friend" && friendState.friendRequests.length > 0 && (
                  <span className="absolute -right-1.5 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#25d366] text-[9px] font-bold text-[#005523]">
                    {friendState.friendRequests.length}
                  </span>
                )}
                {tab === "status" && hasUnviewedStatuses && (
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#faf2ea] bg-[#25d366]" />
                )}
              </div>
              <span className="text-[11px]">{label}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto flex w-full flex-col items-center space-y-3 px-2">
          <button
            onClick={() => setActiveNavTab("settings")}
            className={`flex w-full flex-col items-center justify-center rounded-xl py-2 transition-colors ${
              activeNavTab === "settings"
                ? "bg-[#a5ede0] font-bold text-[#006d2f]"
                : "text-[#3c4a3d] hover:bg-[#eee7df]"
            }`}
            title="Settings"
          >
            <Settings className="mb-1 h-5 w-5" />
            <span className="text-[11px]">Settings</span>
          </button>

          <div
            onClick={() => currentUser && friendState.setSelectedUser(currentUser)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-[#e8e1d9] bg-[#006d2f] text-sm font-bold text-white shadow-sm transition-colors hover:border-[#25d366]"
            title="My Profile"
          >
            {getUserInitial(currentUser?.name)}
          </div>
        </div>
      </nav>

      <aside className="flex h-full w-80 shrink-0 flex-col overflow-hidden border-r border-[#bbcbb9]/40 bg-white pb-16 md:w-96 md:pb-0">
        {activeNavTab === "chats" && (
          <ChatsPage
            chats={chatsState.chats}
            loadingChats={chatsState.loadingChats}
            searchTerm={chatsState.searchTerm}
            setSearchTerm={chatsState.setSearchTerm}
            activeFilter={chatsState.activeFilter}
            setActiveFilter={chatsState.setActiveFilter}
            filteredChats={chatsState.filteredChats}
            getOtherUser={chatsState.getOtherUser}
            markChatRead={chatsState.markChatRead}
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            currentUser={currentUser}
            onlineUsers={onlineUsers}
          />
        )}

        {activeNavTab === "status" && (
          <StatusPage
            currentUser={statusesState.currentUser}
            myStatuses={statusesState.myStatuses}
            recentGroups={statusesState.recentGroups}
            viewedGroups={statusesState.viewedGroups}
            isLoading={statusesState.isLoading}
            error={statusesState.error}
            postStatus={statusesState.postStatus}
            viewStatus={statusesState.viewStatus}
            toggleLike={statusesState.toggleLike}
            deleteStatus={statusesState.deleteStatus}
          />
        )}
        {activeNavTab === "channels" && <ChannelsPage />}

        {activeNavTab === "add-friend" && (
          <AddFriendPage
            friendRequests={friendState.friendRequests}
            friendSearchTerm={friendState.friendSearchTerm}
            setFriendSearchTerm={friendState.setFriendSearchTerm}
            searchResults={friendState.searchResults}
            isSearching={friendState.isSearching}
            onUserClick={friendState.handleUserSearchClick}
            onSendFriendRequest={friendState.handleSendFriendRequest}
            onAcceptRequest={friendState.handleAcceptRequest}
            onRejectRequest={friendState.handleRejectRequest}
          />
        )}

        {activeNavTab === "settings" && (
          <SettingsPage currentUser={currentUser} onLogout={handleLogout} />
        )}
      </aside>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-[#bbcbb9]/40 bg-[#faf2ea] pb-[env(safe-area-inset-bottom)] md:hidden"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
      >
        {NAV_ITEMS.map(({ tab, label, icon: Icon }) => (
          <button
            key={tab}
            onClick={() => setActiveNavTab(tab)}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
              activeNavTab === tab ? "font-bold text-[#006d2f]" : "text-[#3c4a3d]"
            }`}
            title={label}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />
              {tab === "add-friend" && friendState.friendRequests.length > 0 && (
                <span className="absolute -right-1.5 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#25d366] text-[9px] font-bold text-[#005523]">
                  {friendState.friendRequests.length}
                </span>
              )}
              {tab === "status" && hasUnviewedStatuses && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#faf2ea] bg-[#25d366]" />
              )}
            </div>
            <span className="text-[10px] leading-tight">{label}</span>
          </button>
        ))}

        <button
          onClick={() => setActiveNavTab("settings")}
          className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
            activeNavTab === "settings" ? "font-bold text-[#006d2f]" : "text-[#3c4a3d]"
          }`}
          title="Settings"
        >
          <Settings className="h-5 w-5" />
          <span className="text-[10px] leading-tight">Settings</span>
        </button>
      </nav>

      {friendState.selectedUser && (
        <UserProfileModal
          user={friendState.selectedUser}
          currentUserId={currentUser?._id}
          requestId={friendState.selectedRequestId}
          onClose={() => {
            friendState.setSelectedUser(null);
            friendState.setSelectedRequestId(null);
          }}
          onAddFriend={friendState.handleSendFriendRequest}
          onAcceptRequest={friendState.handleAcceptRequest}
          onRejectRequest={friendState.handleRejectRequest}
        />
      )}
    </div>
  );
}