const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  loanId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Loan', 
    required: true 
  },
  installmentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Installment', 
    required: false 
  },
  collectorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  paymentMode: { 
    type: String, 
    enum: ['Cash', 'UPI', 'Bank Transfer'], 
    default: 'Cash' 
  },
  receiptNumber: { 
    type: String, 
    unique: true 
  },
  collectedDate: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// Auto-generate a unique receipt number before saving if not provided
transactionSchema.pre('save', async function() {
  if (!this.receiptNumber) {
    const now = new Date();
    const dateStr = now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    
    // Generate a random 4-digit number to avoid collisions on rapid bulk submits
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.receiptNumber = `REC-${dateStr}-${rand}`;
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
