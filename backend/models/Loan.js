const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  amount: { type: Number, required: true },
  interestRate: { type: Number, required: true }, // Annual interest rate in percentage
  duration: { type: Number, required: true }, // in months
  emiAmount: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  startDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Active', 'Completed', 'Defaulted'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Loan', loanSchema);
