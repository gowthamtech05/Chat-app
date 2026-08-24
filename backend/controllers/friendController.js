const FriendRequest = require("../models/FriendRequest");
const User = require("../models/User");
const Chat = require("../models/Chat");

const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user._id;
    const receiverId = req.params.userId;

    if (senderId.toString() === receiverId) {
      return res.status(400).json({
        message: "You cannot send a friend request to yourself",
      });
    }

    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
      status: { $in: ["pending", "accepted"] },
    });

    if (existingRequest) {
      return res.status(400).json({
        message: `Friend request already exists with status: ${existingRequest.status}`,
      });
    }

    const request = await FriendRequest.create({
      sender: senderId,
      receiver: receiverId,
      status: "pending",
    });

    const populatedRequest = await request.populate([
      { path: "sender", select: "name email avatar" },
      { path: "receiver", select: "name email avatar" },
    ]);

    return res.status(201).json({
      message: "Friend request sent",
      request: populatedRequest,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const requests = await FriendRequest.find({
      receiver: userId,
      status: "pending",
    }).populate("sender", "name email avatar");

    return res.status(200).json(requests);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        message: "Friend request not found",
      });
    }

    if (request.receiver.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Not authorized to accept this request",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        message: "This friend request is no longer pending",
      });
    }

    request.status = "accepted";
    await request.save();

    await User.findByIdAndUpdate(request.sender, {
      $addToSet: {
        friends: request.receiver,
      },
    });

    await User.findByIdAndUpdate(request.receiver, {
      $addToSet: {
        friends: request.sender,
      },
    });

    let chat = await Chat.findOne({
      isGroupChat: false,
      members: {
        $all: [request.sender, request.receiver],
      },
    });

    if (!chat) {
      chat = await Chat.create({
        isGroupChat: false,
        members: [request.sender, request.receiver],
      });
    }

    const populatedChat = await Chat.findById(chat._id).populate(
      "members",
      "name email avatar",
    );

    return res.status(200).json({
      message: "Friend request accepted",
      request,
      chat: populatedChat,
    });
  } catch (error) {
    console.error("Accept friend request error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (request.receiver.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to reject this request" });
    }

   
    await FriendRequest.findByIdAndDelete(requestId);

    return res.status(200).json({
      message: "Friend request rejected and deleted from database",
      requestId,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
};
