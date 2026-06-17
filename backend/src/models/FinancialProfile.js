const mongoose = require('mongoose');

const FinancialProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    monthlyIncome: {
      type: Number,
      required: [true, 'Please add monthly income'],
      min: [0, 'Monthly income cannot be negative']
    },
    monthlyExpenses: {
      type: Number,
      required: [true, 'Please add monthly expenses'],
      min: [0, 'Monthly expenses cannot be negative']
    },
    savings: {
      type: Number,
      default: 0,
      min: [0, 'Savings cannot be negative']
    },
    dependents: {
      type: Number,
      default: 0,
      min: [0, 'Dependents cannot be negative']
    },
    emergencyFund: {
      type: Number,
      default: 0,
      min: [0, 'Emergency fund cannot be negative']
    },
    riskPreference: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
    employmentType: {
      type: String,
      default: 'Salaried'
    },
    salaryDate: {
      type: Number,
      min: 1,
      max: 31,
      default: 1
    },
    financialGoals: {
      type: String,
      default: ''
    },
    auditTrail: [
      {
        field: {
          type: String,
          required: true
        },
        previousValue: {
          type: mongoose.Schema.Types.Mixed,
          required: true
        },
        newValue: {
          type: mongoose.Schema.Types.Mixed,
          required: true
        },
        changedBy: {
          type: String,
          default: 'User'
        },
        reason: {
          type: String,
          default: 'Profile update'
        },
        updatedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('FinancialProfile', FinancialProfileSchema);
