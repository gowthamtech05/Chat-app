const mongoose = require("mongoose");

const statusViewSchema = new mongoose.Schema({
  status: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Status",
    required: true,
    index: true,
  },

  viewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  viewedAt: {
    type: Date,
    default: Date.now,
  },
});

statusViewSchema.index({ status: 1, viewer: 1 }, { unique: true });

module.exports = mongoose.model("StatusView", statusViewSchema);
