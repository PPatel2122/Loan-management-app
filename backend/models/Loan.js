const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  amount: { type: Number, required: true },
  interestRate: { type: Number, required: true }, // Annual interest rate in percentage
  duration: { type: Number, required: true }, // in months
  emiAmount: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  startDate: { type: Date, default: Date.now },
  paymentFrequency: { type: String, enum: ['Monthly', 'Weekly'], default: 'Monthly' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Active', 'Completed', 'Defaulted'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Loan', loanSchema);
