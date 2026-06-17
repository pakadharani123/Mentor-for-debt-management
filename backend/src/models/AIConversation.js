const mongoose = require('mongoose');

const FinancialSnapshotSchema = new mongoose.Schema({
  recoveryScore: { type: Number, default: 0 },
  recoveryCategory: { type: String, default: 'Unknown' },
  remainingDebt: { type: Number, default: 0 },
  monthlyIncome: { type: Number, default: 0 },
  monthlyExpenses: { type: Number, default: 0 },
  monthlySurplus: { type: Number, default: 0 },
  dti: { type: Number, default: 0 },
  debtFreeDate: { type: String, default: null }
}, { _id: false });

const AIConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    question: {
      type: String,
      required: true,
      trim: true
    },
    aiResponse: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    intent: {
      type: String,
      default: 'GENERAL'
    },
    language: {
      type: String,
      default: 'en'
    },
    financialSnapshot: {
      type: FinancialSnapshotSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

// Compound index for fast per-user history queries sorted by newest
AIConversationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('AIConversation', AIConversationSchema);
