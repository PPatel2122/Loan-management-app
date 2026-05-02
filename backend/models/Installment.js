const mongoose = require('mongoose');

const installmentSchema = new mongoose.Schema({
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
  dueDate: { type: Date, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Paid', 'Overdue'], default: 'Pending' },
  penalty: { type: Number, default: 0 },
  remainingAmount: { type: Number, required: true },
  paidDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Installment', installmentSchema);
