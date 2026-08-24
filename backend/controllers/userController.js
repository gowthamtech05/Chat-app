const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");

const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(200).json([]);
    }

    const sanitizedQuery = escapeRegex(query.trim());

    const filter = {
      $or: [
        { name: { $regex: sanitizedQuery, $options: "i" } },
        { email: { $regex: sanitizedQuery, $options: "i" } },
      ],
    };

    if (req.user && req.user._id) {
      filter._id = { $ne: req.user._id };
    }

    const users = await User.find(filter).select("_id name email");
    const currentUserId = req.user._id;

    
    const results = await Promise.all(
      users.map(async (user) => {
        const request = await FriendRequest.findOne({
          $or: [
            {
              sender: currentUserId,
              receiver: user._id,
            },
            {
              sender: user._id,
              receiver: currentUserId,
            },
          ],
        });

        let friendshipStatus = "none";
        let requestId = null;

        if (request) {
          requestId = request._id;

          if (request.status === "accepted") {
            friendshipStatus = "friends";
          } else if (request.status === "pending") {
            if (request.sender.toString() === currentUserId.toString()) {
              friendshipStatus = "pending_sent";
            } else {
              friendshipStatus = "pending_received";
            }
          }
        }

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          friendshipStatus,
          requestId,
        };
      })
    );

    return res.status(200).json(results);
  } catch (error) {
    console.error("Error in searchUsers:", error);
    return res.status(500).json({
      message: error.message || "Failed to search users",
    });
  }
};

module.exports = {
  searchUsers,
};