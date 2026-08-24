import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  Paperclip,
  Send,
  X,
  Check,
  CheckCheck,
  Image as ImageIcon,
} from "lucide-react";
import {
  getMessages,
  markSeen,
  sendMessage,
  uploadImage,
} from "../features/chat/chatAPI";
import type { RootState } from "../app/store";
import type { Message } from "../types/message";
import type { Chat } from "../types/chat";
import socket from "../socket";

interface ChatWindowProps {
  chat: Chat;
  currentUserId: string;
  onBack?: () => void;
}

type LocalMessage = Message & {
  tempId?: string;
  status?: "sending" | "failed";
};

function formatLastSeen(lastSeen?: string | Date | null): string {
  if (!lastSeen) return "Last seen recently";

  const seenDate = new Date(lastSeen);
  const now = new Date();
  const time = seenDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isSameDay =
    seenDate.getDate() === now.getDate() &&
    seenDate.getMonth() === now.getMonth() &&
    seenDate.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    seenDate.getDate() === yesterday.getDate() &&
    seenDate.getMonth() === yesterday.getMonth() &&
    seenDate.getFullYear() === yesterday.getFullYear();

  if (isSameDay) return `Last seen today at ${time}`;
  if (isYesterday) return `Last seen yesterday at ${time}`;

  const dd = String(seenDate.getDate()).padStart(2, "0");
  const mm = String(seenDate.getMonth() + 1).padStart(2, "0");
  return `Last seen on ${dd}/${mm}/${seenDate.getFullYear()}`;
}

function mergeMessage(
  prev: LocalMessage[],
  incoming: LocalMessage,
  tempIdToReplace?: string,
): LocalMessage[] {
  let next = prev;
  if (tempIdToReplace) {
    next = prev.filter((m) => m.tempId !== tempIdToReplace);
  }
  if (next.some((m) => m._id === incoming._id)) return next; 
  return [...next, incoming].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function ChatWindow({ chat, currentUserId, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [typingUser, setTypingUser] = useState("");
  const [replyMessage, setReplyMessage] = useState<LocalMessage | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const onlineUsers = useSelector((state: RootState) => state.chat.onlineUsers) || [];

  const otherUser = chat.members.find((member) => member._id !== currentUserId);
  const isOtherUserOnline = otherUser ? onlineUsers.includes(otherUser._id) : false;

  const [otherUserLastSeen, setOtherUserLastSeen] = useState<string | undefined>(
    otherUser?.lastSeen ? new Date(otherUser.lastSeen).toISOString() : undefined,
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUser]);


  useEffect(() => {
    const join = () => socket.emit("joinChat", chat._id);
    join();
    socket.on("connect", join);
    return () => {
      socket.off("connect", join);
      socket.emit("leaveChat", chat._id);
    };
  }, [chat._id]);

  useEffect(() => {
    const handleTyping = ({ chatId, user }: { chatId: string; user: string }) => {
      if (chatId !== chat._id) return;
      setTypingUser(user);
    };
    const handleStopTyping = ({ chatId }: { chatId: string }) => {
      if (chatId !== chat._id) return;
      setTypingUser("");
    };

    socket.on("userTyping", handleTyping);
    socket.on("userStoppedTyping", handleStopTyping);
    return () => {
      socket.off("userTyping", handleTyping);
      socket.off("userStoppedTyping", handleStopTyping);
    };
  }, [chat._id]);

  useEffect(() => {
    const handleReceiveMessage = (message: Message) => {
      if (message.chat !== chat._id) return;
      setMessages((prev) => mergeMessage(prev, message));

      markSeen(chat._id)
        .then(() => socket.emit("messagesSeen", { chatId: chat._id, seenBy: currentUserId }))
        .catch((error) => console.error("Error marking seen:", error));
    };

    const handleMessageDelivered = ({ messageId, chatId }: { messageId: string; chatId: string }) => {
      if (chatId !== chat._id) return;
      setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, delivered: true } : m)));
    };

    const handleMessagesSeen = ({ chatId, seenBy }: { chatId: string; seenBy: string }) => {
      if (chatId !== chat._id || seenBy === currentUserId) return;
      setMessages((prev) =>
        prev.map((m) => (m.sender._id === currentUserId ? { ...m, seen: true, delivered: true } : m))
      );
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messageDelivered", handleMessageDelivered);
    socket.on("messagesSeen", handleMessagesSeen);
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messageDelivered", handleMessageDelivered);
      socket.off("messagesSeen", handleMessagesSeen);
    };
  }, [chat._id, currentUserId]);

  useEffect(() => {
    let isActive = true;

    const loadMessages = async () => {
      try {
        const data = await getMessages(chat._id);
        if (!isActive) return;
        const firstUnread = data.find((m: Message) => !m.seen && m.sender._id !== currentUserId);
        setFirstUnreadId(firstUnread ? firstUnread._id : null);
        setMessages(data);
        setTypingUser("");

        await markSeen(chat._id);
        socket.emit("messagesSeen", { chatId: chat._id, seenBy: currentUserId });
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    };

    loadMessages();
    return () => {
      isActive = false;
    };
  }, [chat._id, currentUserId]);

  useEffect(() => {
    setOtherUserLastSeen(
      otherUser?.lastSeen ? new Date(otherUser.lastSeen).toISOString() : undefined,
    );
    const handleLastSeen = ({ userId: uid, lastSeen }: { userId: string; lastSeen: string }) => {
      if (uid !== otherUser?._id) return;
      setOtherUserLastSeen(lastSeen); 
    };
    socket.on("userLastSeen", handleLastSeen);
    return () => {
      socket.off("userLastSeen", handleLastSeen);
    };
  }, [otherUser?._id, otherUser?.lastSeen]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);

    socket.emit("typing", { chatId: chat._id, user: currentUser?.name || "Someone" });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", chat._id);
    }, 1000);
  };

  const handleSend = async () => {
    if ((!text.trim() && !image) || isSending) return;

    const tempId = `temp-${Date.now()}`;
    const draftText = text;
    const draftImage = image;
    const draftReplyId = replyMessage?._id;
    const optimistic: LocalMessage = {
      _id: tempId,
      tempId,
      chat: chat._id,
      sender: { _id: currentUserId, name: currentUser?.name || "" } as Message["sender"],
      text: draftText,
      image: draftImage ? URL.createObjectURL(draftImage) : undefined,
      seen: false,
      delivered: false,
      replyTo: replyMessage
        ? {
            _id: replyMessage._id,
            text: replyMessage.text,
            sender: { _id: replyMessage.sender._id, name: replyMessage.sender.name },
          }
        : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "sending",
    };
    setMessages((prev) => [...prev, optimistic]);

    setText("");
    setImage(null);
    setReplyMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    await deliverMessage(tempId, draftText, draftImage, draftReplyId);
  };

  const deliverMessage = async (
    tempId: string,
    draftText: string,
    draftImage: File | null,
    draftReplyId?: string,
  ) => {
    try {
      setIsSending(true);
      let imageUrl: string | null = null;
      if (draftImage) imageUrl = await uploadImage(draftImage);

      const message = await sendMessage(chat._id, draftText, imageUrl, draftReplyId);
      setMessages((prev) => mergeMessage(prev, message, tempId));
      socket.emit("sendMessage", message);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.emit("stopTyping", chat._id);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? { ...m, status: "failed" } : m)),
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleRetry = (message: LocalMessage) => {
    if (!message.tempId) return;
    setMessages((prev) =>
      prev.map((m) => (m.tempId === message.tempId ? { ...m, status: "sending" } : m)),
    );
    deliverMessage(message.tempId, message.text || "", null, message.replyTo?._id);
  };

  const headerTitle = chat.isGroupChat ? chat.groupName : otherUser?.name || "Chat";
  const headerInitial = headerTitle ? headerTitle.charAt(0).toUpperCase() : "?";

  const renderTicks = (message: LocalMessage) => {
    if (message.seen) return <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />;
    if (message.delivered) return <CheckCheck className="h-3.5 w-3.5 text-white/80" />; 
    return <Check className="h-3.5 w-3.5 text-white/80" />;
  };

  return (
    <div className="absolute inset-0 z-30 flex h-full w-full flex-col bg-[#fff8f1] md:static md:z-auto md:flex-1">
      <header className="flex shrink-0 items-center justify-between border-b border-[#bbcbb9]/40 bg-[#faf2ea] px-4 py-3 shadow-xs">
        <div className="flex min-w-0 items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#3c4a3d] transition hover:bg-[#eee7df] md:hidden"
              aria-label="Back to chats"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          <div className="relative shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#006d2f] text-sm font-bold text-white shadow-xs">
              {headerInitial}
            </div>
            {!chat.isGroupChat && isOtherUserOnline && (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#25d366]" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold leading-tight text-[#1e1b17]">{headerTitle}</h2>
            {!chat.isGroupChat && (
              <p className="truncate text-xs text-[#6c7b6b]">
                {isOtherUserOnline ? (
                  <span className="font-semibold text-[#006d2f]">Online</span>
                ) : (
                  formatLastSeen(otherUserLastSeen ?? otherUser?.lastSeen)
                )}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {messages.map((message) => {
          const isMe = message.sender._id === currentUserId;
          return (
            <div key={message._id}>
              {message._id === firstUnreadId && (
                <div className="my-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-[#bbcbb9]/40" />
                  <span className="text-[11px] font-semibold text-[#6c7b6b]">New messages</span>
                  <div className="h-px flex-1 bg-[#bbcbb9]/40" />
                </div>
              )}
              <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div
                  className={`group relative max-w-[85%] rounded-2xl px-4 py-2.5 shadow-xs sm:max-w-[70%] ${
                    isMe
                      ? "rounded-tr-none bg-[#006d2f] text-white"
                      : "rounded-tl-none border border-[#bbcbb9]/40 bg-white text-[#1e1b17]"
                  }`}
                >
                  {!isMe && chat.isGroupChat && (
                    <span className="mb-1 block text-xs font-bold text-[#006d2f]">{message.sender.name}</span>
                  )}

                  {message.replyTo && (
                    <div
                      className={`mb-2 rounded-lg border-l-4 p-2 text-xs ${
                        isMe ? "border-[#25d366] bg-[#005223] text-[#e0f2e5]" : "border-[#006d2f] bg-[#f4ede5] text-[#3c4a3d]"
                      }`}
                    >
                      <span className="block font-semibold">{message.replyTo.sender.name}</span>
                      <p className="truncate">{message.replyTo.text || "📷 Attachment"}</p>
                    </div>
                  )}

                  {message.image && (
                    <div className="mb-2 overflow-hidden rounded-xl">
                      <img src={message.image} alt="Attachment" className="max-h-60 w-full rounded-xl object-cover" />
                    </div>
                  )}

                  {message.text && (
                    <p className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed">{message.text}</p>
                  )}

                  <div className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${isMe ? "text-[#a3e6b7]" : "text-[#6c7b6b]"}`}>
                    <button
                      onClick={() => setReplyMessage(message)}
                      className="mr-auto font-semibold opacity-0 transition-opacity hover:underline group-hover:opacity-100"
                    >
                      Reply
                    </button>
                    {isMe && message.status === "failed" && (
                      <button
                        onClick={() => handleRetry(message)}
                        className="flex items-center gap-1 text-[10px] font-semibold text-red-300 hover:underline"
                      >
                        ⚠️ Retry
                      </button>
                    )}
                    {isMe && message.status !== "failed" && (
                      <span>{message.status === "sending" ? <Check className="h-3.5 w-3.5 text-white/50" /> : renderTicks(message)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {typingUser && (
          <div className="flex w-fit items-center gap-2 rounded-full border border-[#bbcbb9]/40 bg-[#f4ede5] px-3 py-1.5 text-xs italic text-[#6c7b6b]">
            <span className="h-2 w-2 animate-ping rounded-full bg-[#006d2f]" />
            {typingUser} is typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {replyMessage && (
        <div className="flex items-center justify-between border-t border-[#bbcbb9]/40 bg-[#f4ede5] px-4 py-2">
          <div className="border-l-4 border-[#006d2f] pl-3">
            <span className="block text-xs font-bold text-[#006d2f]">Replying to {replyMessage.sender.name}</span>
            <p className="max-w-md truncate text-xs text-[#3c4a3d]">{replyMessage.text || "📷 Photo"}</p>
          </div>
          <button onClick={() => setReplyMessage(null)} className="p-1 text-[#6c7b6b] transition hover:text-[#1e1b17]">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {image && (
        <div className="flex items-center justify-between border-t border-[#bbcbb9]/40 bg-[#f4ede5] px-4 py-2">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-[#006d2f]" />
            <span className="text-xs font-semibold text-[#006d2f]">Attached: {image.name}</span>
          </div>
          <button onClick={() => setImage(null)} className="text-xs font-semibold text-red-600 hover:underline">
            Remove
          </button>
        </div>
      )}

      <footer className="shrink-0 border-t border-[#bbcbb9]/40 bg-[#faf2ea] p-3">
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#3c4a3d] transition hover:bg-[#eee7df] hover:text-[#006d2f]"
            title="Attach Image"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          <input
            type="text"
            placeholder="Type a message..."
            value={text}
            onChange={handleTyping}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            className="min-w-0 flex-1 rounded-full border border-transparent bg-[#f4ede5] px-4 py-2 text-sm text-[#1e1b17] placeholder-[#6c7b6b] outline-none transition focus:border-[#25d366] focus:bg-white focus:ring-2 focus:ring-[#25d366]/20"
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || (!text.trim() && !image)}
            className="flex h-10 items-center justify-center rounded-full bg-[#006d2f] px-5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#005223] disabled:cursor-not-allowed disabled:bg-[#aac5b2]"
          >
            {isSending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}

export default ChatWindow;