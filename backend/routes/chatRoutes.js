const express = require("express");
const multer = require("multer");

const {
  createChat,
  getMyChats,
  sendMessage,
  getMessages,
  markMessagesSeen,
  uploadImage,
  createGroupChat,
  getChatById,
} = require("../controllers/chatController");

const protect = require("../middleware/authMiddleware");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
});

const router = express.Router();

router.post("/", protect, createChat);
router.get("/", protect, getMyChats);
router.get("/:chatId", protect, getChatById);
router.post("/message", protect, sendMessage);
router.get("/:chatId/messages", protect, getMessages);
router.put("/:chatId/seen", protect, markMessagesSeen);
router.post("/upload", protect, upload.single("image"), uploadImage);
router.post("/group", protect, createGroupChat);

module.exports = router;
