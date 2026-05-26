const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  companyName: { type: String, default: 'ZenLoan Microfinance' },
  interestRate: { type: Number, default: 12 }, // default interest rate % p.a.
  penaltyRate: { type: Number, default: 10 },  // flat penalty in ₹ per overdue day
  supportPhone: { type: String, default: '917999049627' } // default support/WhatsApp notification phone
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
