import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import socket from "../socket";
import { setOnlineUsers } from "../features/chat/chatSlice";
import { getChatById } from "../features/chat/chatAPI";

import type { RootState, AppDispatch } from "../app/store";
import type { Chat as ChatType } from "../types/chat";

import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

function Chat() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId: string }>();

  const [selectedChat, setSelectedChat] = useState<ChatType | null>(null);
  const [chatLoadError, setChatLoadError] = useState(false);

  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (!user) return;

    if (socket.disconnected) {
      socket.connect();
    }

    const registerUser = () => {
      console.log("Socket connected:", socket.id);
      socket.emit("addUser", user._id);
    };

    socket.on("connect", registerUser);

    if (socket.connected) {
      registerUser();
    }

    return () => {
      socket.off("connect", registerUser);
    };
  }, [user]);

  useEffect(() => {
    const handleOnlineUsers = (users: string[]) => {
      dispatch(setOnlineUsers(users));
    };

    socket.on("onlineUsers", handleOnlineUsers);

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
    };
  }, [dispatch]);

  useEffect(() => {
    if (!chatId) {
      setSelectedChat(null);
      return;
    }

    if (selectedChat?._id === chatId) return;

    setChatLoadError(false);
    let isActive = true;

    getChatById(chatId)
      .then((chat) => {
        if (isActive) {
          setSelectedChat(chat);
        }
      })
      .catch(() => {
        if (isActive) {
          setChatLoadError(true);
        }
      });

    return () => {
      isActive = false;
    };
  }, [chatId]);

  const handleBack = () => navigate("/chats");

  const handleSelectChat = (chat: ChatType) => {
    setSelectedChat(chat);
    navigate(`/chat/${chat._id}`);
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#fff8f1] font-sans text-[#1e1b17] antialiased">
      <div
        className={`${
          selectedChat ? "hidden md:flex" : "flex"
        } h-full w-full shrink-0 flex-col overflow-hidden md:w-auto`}
      >
        <Sidebar
          selectedChat={selectedChat}
          setSelectedChat={handleSelectChat}
        />
      </div>
      <main
        className={`${
          selectedChat ? "flex" : "hidden md:flex"
        } h-full min-w-0 flex-1 flex-col overflow-hidden bg-[#fff8f1]`}
      >
        {selectedChat && user ? (
          <ChatWindow
            chat={selectedChat}
            currentUserId={user._id}
            onBack={handleBack}
          />
        ) : chatId && chatLoadError ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-sm text-[#6c7b6b]">
            This conversation isn't available.
          </div>
        ) : (
          <div className="flex flex-1 select-none flex-col items-center justify-center bg-[#fff8f1] p-8 text-center">
            <div className="flex max-w-md flex-col items-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#25d366]/20 bg-[#25d366]/10 text-[#006d2f] shadow-xs">
                <svg
                  className="h-10 w-10 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
                </svg>
              </div>
              <h2 className="mb-2 text-2xl font-bold tracking-tight text-[#1e1b17]">
                Kinetic Comm for Web
              </h2>
              <p className="mb-6 max-w-sm text-sm leading-relaxed text-[#3c4a3d]">
                Send and receive messages seamlessly. Select a chat from the
                sidebar to start a conversation.
              </p>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#bbcbb9] bg-[#f4ede5] px-4 py-2 text-xs font-semibold text-[#006d2f]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#25d366]"></span>
                End-to-end encrypted
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Chat;