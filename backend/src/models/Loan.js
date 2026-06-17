const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    loanName: {
      type: String,
      required: [true, 'Please add a loan name'],
      trim: true
    },
    loanType: {
      type: String,
      required: [true, 'Please select a loan type'],
      enum: [
        'Personal Loan',
        'Home Loan',
        'Education Loan',
        'Vehicle Loan',
        'Credit Card Debt',
        'Other'
      ]
    },
    principalAmount: {
      type: Number,
      required: [true, 'Please add principal amount'],
      min: [1, 'Principal amount must be positive']
    },
    remainingAmount: {
      type: Number,
      required: [true, 'Please add remaining amount'],
      min: [0, 'Remaining amount cannot be negative']
    },
    interestRate: {
      type: Number,
      required: [true, 'Please add annual interest rate (percentage)'],
      min: [0, 'Interest rate cannot be negative']
    },
    emi: {
      type: Number,
      required: [true, 'Please add EMI amount'],
      min: [0, 'EMI cannot be negative']
    },
    startDate: {
      type: Date,
      required: [true, 'Please add loan start date']
    },
    dueDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['Active', 'Paid Off'],
      default: 'Active'
    }
  },
  {
    timestamps: true
  }
);

// Pre-save validation: remaining amount cannot exceed principal
LoanSchema.pre('save', function (next) {
  if (this.remainingAmount > this.principalAmount) {
    this.remainingAmount = this.principalAmount;
  }
  
  if (this.remainingAmount === 0) {
    this.status = 'Paid Off';
  } else {
    this.status = 'Active';
  }
  next();
});

module.exports = mongoose.model('Loan', LoanSchema);
