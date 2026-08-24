const express = require("express");
const {
  createStatus,
  getActiveStatuses,
  viewStatus,
  getStatusViewers,
  likeStatus,
  unlikeStatus,
  getStatusLikes,
  deleteStatus,
} = require("../controllers/statusController");
const protect = require("../middleware/authMiddleware");
const uploadStatusMedia = require("../middleware/uploadStatusMedia");

const router = express.Router();

router.post("/", protect, uploadStatusMedia, createStatus);


router.get("/", protect, getActiveStatuses);


router.post("/:statusId/view", protect, viewStatus);

router.get("/:statusId/viewers", protect, getStatusViewers);

router.post("/:statusId/like", protect, likeStatus);

router.delete("/:statusId/like", protect, unlikeStatus);

router.get("/:statusId/likes", protect, getStatusLikes);

router.delete("/:statusId", protect, deleteStatus);

module.exports = router;