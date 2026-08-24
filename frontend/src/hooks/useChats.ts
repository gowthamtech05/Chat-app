import { useCallback, useEffect, useState } from "react";
import socket from "../socket";
import type { Message } from "../types/message";
import type { Chat } from "../types/chat";
import type { User as UserType } from "../types/user";
import type { FilterType } from "../types/navigation";
import { getMyChats } from "../features/chat/chatAPI";

export function useChats(currentUser: UserType | null | undefined) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const getOtherUser = useCallback(
    (chat: Chat): UserType | undefined =>
      chat.members?.find((member) => member._id !== currentUser?._id),
    [currentUser?._id]
  );

  const loadChats = useCallback(async () => {
    try {
      setLoadingChats(true);
      const data = await getMyChats();
      setChats(data || []);
    } catch (error) {
      console.error("Failed to load chats:", error);
    } finally {
      setLoadingChats(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    const handleChatUpdated = ({
      chatId,
      lastMessage,
    }: {
      chatId: string;
      lastMessage: Chat["lastMessage"];
    }) => {
      setChats((prev) => {
        const idx = prev.findIndex((c) => c._id === chatId);
        if (idx === -1) return prev;
        const updated = [...prev];
        const chat = { ...updated[idx], lastMessage };
        updated.splice(idx, 1);
        updated.unshift(chat);
        return updated;
      });
    };

    socket.on("chatUpdated", handleChatUpdated);
    return () => {
      socket.off("chatUpdated", handleChatUpdated);
    };
  }, []);


  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      setChats((prev) => {
        const idx = prev.findIndex((c) => c._id === message.chat);
        if (idx === -1) {
          loadChats();
          return prev;
        }
        const updated = [...prev];
        const chat = { ...updated[idx] };
        const currentCount = currentUser ? chat.unreadCounts?.[currentUser._id] || 0 : 0;

        chat.unreadCounts = currentUser
          ? { ...chat.unreadCounts, [currentUser._id]: currentCount + 1 }
          : chat.unreadCounts;
        chat.lastMessage = {
          _id: message._id,
          text: message.text,
          sender: message.sender._id,
          createdAt: message.createdAt,
        };

        updated.splice(idx, 1);
        updated.unshift(chat);
        return updated;
      });
    };

    socket.on("newMessageNotification", handleNewMessage);
    return () => {
      socket.off("newMessageNotification", handleNewMessage);
    };
  }, [currentUser, loadChats]);

  const markChatRead = useCallback(
    (chatId: string) => {
      if (!currentUser) return;
      setChats((prev) =>
        prev.map((c) =>
          c._id === chatId
            ? { ...c, unreadCounts: { ...c.unreadCounts, [currentUser._id]: 0 } }
            : c
        )
      );
    },
    [currentUser]
  );

  const filteredChats = chats.filter((chat) => {
    const unreadCount = currentUser ? chat.unreadCounts?.[currentUser._id] || 0 : 0;

    if (activeFilter === "unread" && unreadCount === 0) return false;
    if (activeFilter === "groups" && !chat.isGroupChat) return false;

    const query = searchTerm.toLowerCase().trim();
    if (!query) return true;

    if (chat.isGroupChat) {
      return chat.groupName?.toLowerCase().includes(query) ?? false;
    }
    const otherUser = getOtherUser(chat);
    return (
      otherUser?.name?.toLowerCase().includes(query) ||
      otherUser?.email?.toLowerCase().includes(query)
    );
  });

  return {
    chats,
    loadingChats,
    loadChats,
    searchTerm,
    setSearchTerm,
    activeFilter,
    setActiveFilter,
    filteredChats,
    getOtherUser,
    markChatRead,
  };
}