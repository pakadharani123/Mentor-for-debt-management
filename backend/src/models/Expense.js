const mongoose = require('mongoose');

const PAYMENT_METHODS = [
  'Cash', 'UPI', 'Net Banking', 'Credit Card', 'Debit Card', 'Cheque', 'Auto-Debit', 'Other'
];

const ExpenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: [true, 'Please add expense amount'],
      min: [0.01, 'Expense amount must be greater than 0']
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: [
        'Food', 'Rent', 'Education', 'Healthcare',
        'Transport', 'Entertainment', 'Shopping', 'Utilities', 'Other'
      ]
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description must not exceed 200 characters']
    },
    // Legacy field kept for backward compatibility — maps to dueDate if paymentStatus is Paid
    date: {
      type: Date,
      default: Date.now
    },
    // ── New payment status fields ─────────────────────────────────────────
    dueDate: {
      type: Date,
      default: null
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Overdue', 'Partially Paid', 'Upcoming'],
      default: 'Pending'
    },
    amountPaid: {
      type: Number,
      default: 0
    },
    paidDate: {
      type: Date,
      default: null
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: null
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, 'Notes must not exceed 300 characters'],
      default: null
    }
  },
  {
    timestamps: true
  }
);

/**
 * Pre-save hook: adjust status dynamically for unpaid items
 */
ExpenseSchema.pre('save', function (next) {
  if (this.paymentStatus === 'Partially Paid') {
    if (this.amountPaid >= this.amount) {
      this.paymentStatus = 'Paid';
      this.paidDate = this.paidDate || new Date();
    }
  } else if (this.paymentStatus !== 'Paid') {
    if (this.dueDate) {
      if (new Date() > new Date(this.dueDate)) {
        this.paymentStatus = 'Overdue';
      } else {
        this.paymentStatus = 'Upcoming';
      }
    } else {
      this.paymentStatus = 'Pending';
    }
  }
  next();
});

/**
 * Instance method: mark this expense as paid
 */
ExpenseSchema.methods.markPaid = function (paidDate, paymentMethod) {
  this.paymentStatus = 'Paid';
  this.paidDate = paidDate || new Date();
  if (paymentMethod) this.paymentMethod = paymentMethod;
  return this.save();
};

module.exports = mongoose.model('Expense', ExpenseSchema);
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
