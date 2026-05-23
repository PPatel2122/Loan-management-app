const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // TTL: automatically delete document after 10 minutes
  }
});

module.exports = mongoose.model('Otp', otpSchema);
