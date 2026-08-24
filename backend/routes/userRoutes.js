const express = require("express");
const { searchUsers } = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");


const router = express.Router();

router.get("/search", protect, searchUsers);

module.exports = router;
