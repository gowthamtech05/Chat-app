const Chat = require("../models/Chat");
const Message = require("../models/Message");
const cloudinary = require("../config/cloudinary");
const { isViewingChat } = require("../utils/presence");

const createChat = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const currentUserId = req.user._id;

    if (currentUserId.toString() === userId) {
      return res.status(400).json({
        message: "Cannot create chat with yourself",
      });
    }

    const existingChat = await Chat.findOne({
      members: {
        $all: [currentUserId, userId],
      },
    })
      .populate("members", "name email avatar isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "name email avatar",
        },
      });

    if (existingChat) {
      return res.status(200).json(existingChat);
    }

    const chat = await Chat.create({
      members: [currentUserId, userId],
    });

    const populatedChat = await chat.populate(
      "members",
      "name email avatar isOnline lastSeen",
    );

    res.status(201).json(populatedChat);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      members: req.user._id,
    })
      .populate("members", "name email avatar isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "name email avatar",
        },
      })
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { chatId, text, image, replyTo } = req.body;

    if (!chatId || (!text?.trim() && !image)) {
      return res.status(400).json({
        message: "Chat ID and text or image are required",
      });
    }

    const message = await Message.create({
      chat: chatId,
      sender: req.user._id,
      text: text?.trim(),
      image,
      replyTo: replyTo || null,
    });

    const chat = await Chat.findById(chatId);
    let anyViewerActive = false;

    if (chat) {
      chat.lastMessage = message._id;

      chat.members.forEach((member) => {
        const memberId = member.toString();
        if (memberId === req.user._id.toString()) return;

        if (isViewingChat(memberId, chatId)) {
          anyViewerActive = true;
          return;
        }

        const current = chat.unreadCounts.get(memberId) || 0;
        chat.unreadCounts.set(memberId, current + 1);
      });

      await chat.save();
    }

    if (anyViewerActive) {
      message.delivered = true;
      message.deliveredAt = new Date();
      message.seen = true;
      message.seenAt = new Date();
      await message.save();
    }

    await message.populate("sender", "name email avatar");
    if (replyTo) {
      await message.populate({
        path: "replyTo",
        populate: { path: "sender", select: "name" },
      });
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findOne({
      _id: chatId,
      members: req.user._id, 
    })
      .populate("members", "name email avatar isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name email avatar" },
      });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await Message.find({
      chat: chatId,
    })
      .populate("sender", "name email avatar")
      .populate({
        path: "replyTo",
        populate: {
          path: "sender",
          select: "name",
        },
      })
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const markMessagesSeen = async (req, res) => {
  try {
    const { chatId } = req.params;

    await Message.updateMany(
      {
        chat: chatId,
        sender: {
          $ne: req.user._id,
        },
        seen: false,
      },
      {
        seen: true,
        seenAt: new Date(),
      },
    );
    const chat = await Chat.findById(chatId);

    if (chat) {
      chat.unreadCounts.set(req.user._id.toString(), 0);
      await chat.save();
    }

    res.status(200).json({
      message: "Messages seen",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const streamUpload = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });
        stream.end(fileBuffer);
      });
    };

    const result = await streamUpload(req.file.buffer);

    res.json({
      imageUrl: result.secure_url,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const createGroupChat = async (req, res) => {
  try {
    const { groupName, members } = req.body;

    if (!groupName?.trim()) {
      return res.status(400).json({
        message: "Group name is required",
      });
    }

    if (!Array.isArray(members) || members.length < 1) {
      return res.status(400).json({
        message: "At least one member is required",
      });
    }

    const uniqueMembers = [
      ...new Set([
        req.user._id.toString(),
        ...members.map((id) => id.toString()),
      ]),
    ];

    const chat = await Chat.create({
      isGroupChat: true,
      groupName: groupName.trim(),
      groupAdmin: req.user._id,
      members: uniqueMembers,
    });

    const populatedChat = await chat.populate(
      "members",
      "name email avatar isOnline lastSeen",
    );

    res.status(201).json(populatedChat);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createChat,
  getMyChats,
  sendMessage,
  getMessages,
  markMessagesSeen,
  uploadImage,
  createGroupChat,
  getChatById,
};
