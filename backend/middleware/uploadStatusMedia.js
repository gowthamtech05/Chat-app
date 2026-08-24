const multer = require("multer");

const storage = multer.memoryStorage();

const ALLOWED_MIME_PREFIXES = ["image/", "video/"];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; 

const fileFilter = (req, file, cb) => {
  const isAllowed = ALLOWED_MIME_PREFIXES.some((prefix) =>
    file.mimetype.startsWith(prefix),
  );
  if (!isAllowed) {
    return cb(new Error("Only image or video files are allowed"));
  }
  cb(null, true);
};

const uploadStatusMedia = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

module.exports = uploadStatusMedia.single("media");
