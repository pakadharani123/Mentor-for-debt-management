const mongoose = require('mongoose');

const PaymentHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      required: true
    },
    amountPaid: {
      type: Number,
      required: [true, 'Please add payment amount'],
      min: [0, 'Payment amount cannot be negative']
    },
    paymentDate: {
      type: Date,
      required: [true, 'Please add payment date'],
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Paid', 'Missed', 'Late'],
      required: [true, 'Please select payment status'],
      default: 'Paid'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('PaymentHistory', PaymentHistorySchema);
