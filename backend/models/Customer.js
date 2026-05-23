const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  address: { type: String, required: true }, // Current Address
  fatherName: { type: String, default: '' },
  motherName: { type: String, default: '' },
  spouseName: { type: String, default: '' },
  childrenNames: { type: String, default: '' },
  totalChildren: { type: Number, default: 0 },
  aadhaarNumber: { type: String, default: '' },
  occupation: { type: String, default: '' },
  monthlyIncome: { type: Number, default: 0 },
  homeType: { type: String, enum: ['Own House', 'Rented House', ''], default: '' },
  permanentAddress: { type: String, default: '' },
  assets: { type: String, default: '' },
  email: { type: String, default: '' },
  customerPhoto: { type: String, default: '' },
  aadhaarPhoto: { type: String, default: '' },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
