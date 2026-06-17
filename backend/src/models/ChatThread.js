const mongoose = require('mongoose');

const ChatThreadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for user query efficiency
ChatThreadSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('ChatThread', ChatThreadSchema);
