const Status = require("../models/Status");
const StatusView = require("../models/StatusView");
const StatusLike = require("../models/StatusLike");
const FriendRequest = require("../models/FriendRequest");

const cloudinary = require("../config/cloudinary");

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const MAX_VIDEO_SECONDS = 30;

function uploadBufferToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });
}

function formatStatus(statusDoc, views, likes, requestingUserId) {
  const isOwner = statusDoc.user._id.toString() === requestingUserId.toString();

  const visibleViews = isOwner
    ? views
    : views.filter((v) => v.viewer._id.toString() === requestingUserId.toString());

  const visibleLikes = isOwner
    ? likes
    : likes.filter((l) => l.user._id.toString() === requestingUserId.toString());

  return {
    id: statusDoc._id,
    userId: statusDoc.user._id,
    userName: statusDoc.user.name,
    userAvatar: statusDoc.user.avatar,
    type: statusDoc.type,
    content: statusDoc.content,
    mediaUrl: statusDoc.mediaUrl,
    backgroundId: statusDoc.backgroundId,
    createdAt: statusDoc.createdAt,
    expiresAt: statusDoc.expiresAt,
    viewers: visibleViews.map((v) => ({
      userId: v.viewer._id,
      userName: v.viewer.name,
      userAvatar: v.viewer.avatar,
      viewedAt: v.viewedAt,
    })),
    likes: visibleLikes.map((l) => ({
      userId: l.user._id,
      userName: l.user.name,
      userAvatar: l.user.avatar,
      likedAt: l.createdAt,
    })),
  };
}

async function canAccessUsersStatus(requestingUserId, statusOwnerId) {
  if (requestingUserId.toString() === statusOwnerId.toString()) return true;

  const accepted = await FriendRequest.findOne({
    status: "accepted",
    $or: [
      { sender: requestingUserId, receiver: statusOwnerId },
      { sender: statusOwnerId, receiver: requestingUserId },
    ],
  });

  return Boolean(accepted);
}

async function getFriendIds(userId) {
  const accepted = await FriendRequest.find({
    status: "accepted",
    $or: [{ sender: userId }, { receiver: userId }],
  }).select("sender receiver");

  return accepted.map((r) => (r.sender.toString() === userId.toString() ? r.receiver : r.sender));
}

const createStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type } = req.body;

    if (!["text", "image", "video"].includes(type)) {
      return res.status(400).json({ message: "type must be 'text', 'image', or 'video'" });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + TWENTY_FOUR_HOURS_MS);

    let content = "";
    let mediaUrl = "";
    let mediaPublicId = "";
    let backgroundId = null;

    if (type === "text") {
      const text = (req.body.content || "").trim();
      if (!text) {
        return res.status(400).json({ message: "Text status cannot be empty" });
      }
      content = text;
      backgroundId = req.body.backgroundId || null;
    } else {
      if (!req.file) {
        return res.status(400).json({ message: `${type} status requires a "media" file` });
      }

      const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
        resource_type: type === "video" ? "video" : "image",
        folder: "statuses",
      });

      if (type === "video" && uploadResult.duration > MAX_VIDEO_SECONDS) {
        await cloudinary.uploader.destroy(uploadResult.public_id, { resource_type: "video" });
        return res.status(400).json({
          message: `Videos must be under ${MAX_VIDEO_SECONDS} seconds.`,
        });
      }

      mediaUrl = uploadResult.secure_url;
      mediaPublicId = uploadResult.public_id;
    }

    const status = await Status.create({
      user: userId,
      type,
      content,
      mediaUrl,
      mediaPublicId,
      backgroundId,
      expiresAt,
    });

    const populated = await status.populate("user", "name email avatar");

    return res.status(201).json(formatStatus(populated, [], [], userId));
  } catch (error) {
    console.error("Create status error:", error);
    return res.status(500).json({ message: error.message });
  }
};

const getActiveStatuses = async (req, res) => {
  try {
    const requestingUserId = req.user._id;
    const now = new Date();

    const friendIds = await getFriendIds(requestingUserId);
    const visibleUserIds = [requestingUserId, ...friendIds];

    const statuses = await Status.find({
      user: { $in: visibleUserIds },
      expiresAt: { $gt: now },
    })
      .populate("user", "name email avatar")
      .sort({ createdAt: 1 });

    if (statuses.length === 0) {
      return res.status(200).json([]);
    }

    const statusIds = statuses.map((s) => s._id);

    const [allViews, allLikes] = await Promise.all([
      StatusView.find({ status: { $in: statusIds } }).populate("viewer", "name email avatar"),
      StatusLike.find({ status: { $in: statusIds } }).populate("user", "name email avatar"),
    ]);

    const viewsByStatus = new Map();
    allViews.forEach((v) => {
      const key = v.status.toString();
      if (!viewsByStatus.has(key)) viewsByStatus.set(key, []);
      viewsByStatus.get(key).push(v);
    });

    const likesByStatus = new Map();
    allLikes.forEach((l) => {
      const key = l.status.toString();
      if (!likesByStatus.has(key)) likesByStatus.set(key, []);
      likesByStatus.get(key).push(l);
    });

    const result = statuses.map((s) =>
      formatStatus(
        s,
        viewsByStatus.get(s._id.toString()) || [],
        likesByStatus.get(s._id.toString()) || [],
        requestingUserId
      )
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Get active statuses error:", error);
    return res.status(500).json({ message: error.message });
  }
};

const viewStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const viewerId = req.user._id;

    const status = await Status.findOne({ _id: statusId, expiresAt: { $gt: new Date() } });
    if (!status) {
      return res.status(404).json({ message: "Status not found or expired" });
    }

    if (!(await canAccessUsersStatus(viewerId, status.user))) {
      return res.status(403).json({ message: "You can only view a friend's status" });
    }

    await StatusView.findOneAndUpdate(
      { status: statusId, viewer: viewerId },
      { $setOnInsert: { viewedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ message: "View recorded" });
  } catch (error) {
    console.error("View status error:", error);
    return res.status(500).json({ message: error.message });
  }
};
const getStatusViewers = async (req, res) => {
  try {
    const { statusId } = req.params;
    const userId = req.user._id;

    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }
    if (status.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only view your own status's viewers" });
    }

    const views = await StatusView.find({ status: statusId })
      .populate("viewer", "name email avatar")
      .sort({ viewedAt: -1 });

    return res.status(200).json(
      views.map((v) => ({
        userId: v.viewer._id,
        userName: v.viewer.name,
        userAvatar: v.viewer.avatar,
        viewedAt: v.viewedAt,
      }))
    );
  } catch (error) {
    console.error("Get status viewers error:", error);
    return res.status(500).json({ message: error.message });
  }
};

const likeStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const userId = req.user._id;

    const status = await Status.findOne({ _id: statusId, expiresAt: { $gt: new Date() } });
    if (!status) {
      return res.status(404).json({ message: "Status not found or expired" });
    }

    if (!(await canAccessUsersStatus(userId, status.user))) {
      return res.status(403).json({ message: "You can only like a friend's status" });
    }

    try {
      await StatusLike.create({ status: statusId, user: userId });
    } catch (error) {
      if (error.code !== 11000) throw error; 
    }

    return res.status(200).json({ message: "Liked" });
  } catch (error) {
    console.error("Like status error:", error);
    return res.status(500).json({ message: error.message });
  }
};

const unlikeStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const userId = req.user._id;

    await StatusLike.findOneAndDelete({ status: statusId, user: userId });

    return res.status(200).json({ message: "Unliked" });
  } catch (error) {
    console.error("Unlike status error:", error);
    return res.status(500).json({ message: error.message });
  }
};

const getStatusLikes = async (req, res) => {
  try {
    const { statusId } = req.params;
    const userId = req.user._id;

    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }
    if (status.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only view your own status's likes" });
    }

    const likes = await StatusLike.find({ status: statusId })
      .populate("user", "name email avatar")
      .sort({ createdAt: -1 });

    return res.status(200).json(
      likes.map((l) => ({
        userId: l.user._id,
        userName: l.user.name,
        userAvatar: l.user.avatar,
        likedAt: l.createdAt,
      }))
    );
  } catch (error) {
    console.error("Get status likes error:", error);
    return res.status(500).json({ message: error.message });
  }
};

const deleteStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const userId = req.user._id;

    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }
    if (status.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only delete your own status" });
    }

    if (status.mediaPublicId) {
      await cloudinary.uploader.destroy(status.mediaPublicId, {
        resource_type: status.type === "video" ? "video" : "image",
      });
    }

    await Promise.all([
      Status.findByIdAndDelete(statusId),
      StatusView.deleteMany({ status: statusId }),
      StatusLike.deleteMany({ status: statusId }),
    ]);

    return res.status(200).json({ message: "Status deleted", statusId });
  } catch (error) {
    console.error("Delete status error:", error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createStatus,
  getActiveStatuses,
  viewStatus,
  getStatusViewers,
  likeStatus,
  unlikeStatus,
  getStatusLikes,
  deleteStatus,
};