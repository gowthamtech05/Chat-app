const dotenv = require("dotenv");
dotenv.config();
const express = require("express");

const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const friendRoutes = require("./routes/friendRoutes");
const statusRoutes = require("./routes/statusRoutes");
const User = require("./models/User");
const Chat = require("./models/Chat");
const Message = require("./models/Message");
const {
  activeChatByUser,
  setActiveChat,
  clearActiveChat,
  isViewingChat,
} = require("./utils/presence");

const app = express();

connectDB();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "https://connectify-wpclone.vercel.app",
    credentials: true,
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/statuses", statusRoutes);

app.get("/", (req, res) => res.send("API Running"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://connectify-wpclone.vercel.app",
    credentials: true,
  },
});

const onlineUsers = new Map();
function addOnlineSocket(userId, socketId) {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
}

function removeOnlineSocket(userId, socketId) {
  const set = onlineUsers.get(userId);
  if (!set) return false;
  set.delete(socketId);
  if (set.size === 0) {
    onlineUsers.delete(userId);
    return true;
  }
  return false;
}

function extractTokenFromCookieHeader(cookieHeader) {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("token="));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

io.use((socket, next) => {
  try {
    const token = extractTokenFromCookieHeader(socket.handshake.headers.cookie);
    if (!token) return next(new Error("Not authenticated"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.userId = (decoded.id || decoded.userId || "").toString();
    if (!socket.data.userId) return next(new Error("Not authenticated"));
    next();
  } catch (error) {
    next(new Error("Not authenticated"));
  }
});

async function syncPendingDeliveries(userId) {
  try {
    const chats = await Chat.find({ members: userId }).select("_id");
    const chatIds = chats.map((c) => c._id);
    if (!chatIds.length) return;

    const pending = await Message.find({
      chat: { $in: chatIds },
      sender: { $ne: userId },
      delivered: false,
    });
    if (!pending.length) return;

    const now = new Date();
    await Message.updateMany(
      { _id: { $in: pending.map((m) => m._id) } },
      { delivered: true, deliveredAt: now },
    );

    pending.forEach((m) => {
      const chatId = m.chat.toString();
      const senderId = m.sender.toString();
      io.to(senderId).emit("messageDelivered", {
        messageId: m._id.toString(),
        chatId,
      });
      io.to(chatId).emit("messageDelivered", {
        messageId: m._id.toString(),
        chatId,
      });
    });
  } catch (error) {
    console.error("Error syncing pending deliveries:", error);
  }
}

io.on("connection", (socket) => {
  socket.on("addUser", async () => {
    const userId = socket.data.userId;
    if (!userId) return;

    const wasOffline = !onlineUsers.has(userId);
    addOnlineSocket(userId, socket.id);
    socket.join(userId);

    if (wasOffline) {
      try {
        await User.findByIdAndUpdate(userId, { isOnline: true });
      } catch (error) {
        console.error("Error setting online status:", error);
      }
    }

    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    syncPendingDeliveries(userId);
  });

  socket.on("joinChat", (chatId) => {
    if (!chatId) return;
    socket.join(chatId);
    setActiveChat(socket.data.userId, chatId);
  });

  socket.on("leaveChat", (chatId) => {
    if (!chatId) return;
    socket.leave(chatId);
    clearActiveChat(socket.data.userId, chatId);
  });

  socket.on("typing", ({ chatId, user }) => {
    if (!chatId) return;
    socket.to(chatId).emit("userTyping", { chatId, user });
  });

  socket.on("stopTyping", (chatId) => {
    if (!chatId) return;
    socket.to(chatId).emit("userStoppedTyping", { chatId });
  });

  socket.on("sendMessage", async (message) => {
    try {
      if (!message?.chat || !message?.sender?._id) return;

      const chatId = message.chat.toString();
      const senderId = message.sender._id.toString();

      socket.to(chatId).emit("receiveMessage", message);

      const chatDoc = await Chat.findById(chatId).select("members lastMessage");
      if (!chatDoc) return;

      const otherMemberIds = chatDoc.members
        .map((id) => id.toString())
        .filter((id) => id !== senderId);

      const lastMessagePayload = {
        _id: message._id,
        text: message.text,
        sender: senderId,
        createdAt: message.createdAt,
      };

      let deliveredSomeone = false;

      otherMemberIds.forEach((memberId) => {
        if (isViewingChat(memberId, chatId)) {
          io.to(memberId).emit("chatUpdated", {
            chatId,
            lastMessage: lastMessagePayload,
          });
          io.to(senderId).emit("messagesSeen", { chatId, seenBy: memberId });
        } else {
          io.to(memberId).emit("newMessageNotification", message);
          if (onlineUsers.has(memberId)) deliveredSomeone = true;
        }
      });

      io.to(senderId).emit("chatUpdated", {
        chatId,
        lastMessage: lastMessagePayload,
      });

      if (deliveredSomeone && !message.delivered && message._id) {
        await Message.findByIdAndUpdate(message._id, {
          delivered: true,
          deliveredAt: new Date(),
        });
        io.to(chatId).emit("messageDelivered", {
          messageId: message._id,
          chatId,
        });
        io.to(senderId).emit("messageDelivered", {
          messageId: message._id,
          chatId,
        });
      }
    } catch (error) {
      console.error("Error relaying message:", error);
    }
  });

  socket.on("messagesSeen", ({ chatId, seenBy }) => {
    if (!chatId || !seenBy) return;
    socket.to(chatId).emit("messagesSeen", { chatId, seenBy });
  });

  socket.on("disconnect", async () => {
    const userId = socket.data.userId;
    if (!userId) return;

    const isFullyOffline = removeOnlineSocket(userId, socket.id);

    if (isFullyOffline) {
      clearActiveChat(userId, activeChatByUser.get(userId));
      try {
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });
      } catch (error) {
        console.error("Error updating last seen:", error);
      }
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
      io.emit("userLastSeen", { userId, lastSeen: new Date() });
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
