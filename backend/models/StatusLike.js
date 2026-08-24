const mongoose = require("mongoose");

const statusLikeSchema = new mongoose.Schema(
  {
    status: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Status",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);
statusLikeSchema.index({ status: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("StatusLike", statusLikeSchema);
