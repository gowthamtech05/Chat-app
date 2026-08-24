const express = require("express");
const {
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} = require("../controllers/friendController");
const authMiddleware = require("../middleware/authMiddleware");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/requests", protect, getFriendRequests);

router.post("/request/:userId", protect, sendFriendRequest);

router.post("/accept/:requestId", protect, acceptFriendRequest);

router.post("/reject/:requestId", protect, rejectFriendRequest);

router.delete("/reject/:requestId", authMiddleware, rejectFriendRequest);

module.exports = router;
