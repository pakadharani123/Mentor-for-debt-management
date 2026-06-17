const mongoose = require('mongoose');

const SavingsGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Please add a goal title'],
      trim: true
    },
    targetAmount: {
      type: Number,
      required: [true, 'Please add a target amount'],
      min: [1, 'Target amount must be positive']
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: [0, 'Current savings amount cannot be negative']
    },
    targetDate: {
      type: Date,
      required: [true, 'Please add a target date']
    },
    status: {
      type: String,
      enum: ['In Progress', 'Completed'],
      default: 'In Progress'
    }
  },
  {
    timestamps: true
  }
);

// Auto-update status when saving is modified
SavingsGoalSchema.pre('save', function (next) {
  if (this.currentAmount >= this.targetAmount) {
    this.status = 'Completed';
  } else {
    this.status = 'In Progress';
  }
  next();
});

module.exports = mongoose.model('SavingsGoal', SavingsGoalSchema);
