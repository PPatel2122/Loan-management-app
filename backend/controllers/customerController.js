const Customer = require('../models/Customer');
const Verification = require('../models/Verification');
const { sendOTPEmail } = require('../services/emailService');
const { calculateRiskScore } = require('../services/riskScoring');

// @desc    Send OTP to email
// @route   POST /api/customers/send-otp
// @access  Private
const sendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save/update verification doc
    await Verification.findOneAndUpdate(
      { email },
      { otp, verified: false, expiresAt },
      { upsert: true, returnDocument: 'after' }
    );

    // Send the email
    await sendOTPEmail(email, otp);

    res.json({ message: 'OTP sent successfully to email.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/customers/verify-otp
// @access  Private
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const verification = await Verification.findOne({ email });
    if (!verification) {
      return res.status(400).json({ message: 'No OTP requested for this email address.' });
    }

    if (verification.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (verification.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP code. Please try again.' });
    }

    verification.verified = true;
    await verification.save();

    res.json({ message: 'Email verified successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add new customer
// @route   POST /api/customers
// @access  Private
const addCustomer = async (req, res) => {
  const { 
    name, email, phone, address, fatherName, motherName, spouseName, 
    childrenNames, totalChildren, aadhaarNumber, occupation, 
    monthlyIncome, homeType, permanentAddress, assets,
    customerPhoto, aadhaarPhoto, guarantorName, guarantorPhone, guarantorRelation
  } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    let customer = await Customer.findOne({ phone });
    if (customer) {
      return res.status(400).json({ message: 'Customer with this phone already exists' });
    }

    // Verify OTP has been verified
    const verification = await Verification.findOne({ email, verified: true });
    if (!verification) {
      return res.status(400).json({ message: 'Email has not been verified yet. Please request and verify an OTP first.' });
    }

    customer = await Customer.create({ 
      name, email, phone, address, fatherName, motherName, spouseName, 
      childrenNames, totalChildren, aadhaarNumber, occupation, 
      monthlyIncome, homeType, permanentAddress, assets,
      customerPhoto, aadhaarPhoto, guarantorName, guarantorPhone, guarantorRelation
    });

    // Clean up verification
    await Verification.deleteOne({ email });

    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getCustomers = async (req, res) => {
  try {
    let filter = {};
    if (req.user && req.user.role !== 'Admin') {
      const Group = require('../models/Group');
      const assignedGroups = await Group.find({ collector: req.user._id });
      const customerIds = assignedGroups.reduce((acc, g) => {
        if (g.members) {
          return acc.concat(g.members.map(m => m.toString()));
        }
        return acc;
      }, []);
      filter = { _id: { $in: customerIds } };
    }

    const rawCustomers = await Customer.find(filter).sort({ createdAt: -1 });
    const customers = [];
    for (const cust of rawCustomers) {
      const custObj = cust.toObject();
      custObj.riskAnalysis = await calculateRiskScore(custObj);
      customers.push(custObj);
    }
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    const custObj = customer.toObject();
    custObj.riskAnalysis = await calculateRiskScore(custObj);

    // Fetch related groups, loans and collections/installments
    const Group = require('../models/Group');
    const Loan = require('../models/Loan');
    const Installment = require('../models/Installment');

    const customerGroups = await Group.find({ members: customer._id });
    custObj.groups = customerGroups;

    const groupIds = customerGroups.map(g => g._id);
    const customerLoans = await Loan.find({ groupId: { $in: groupIds } }).populate('groupId', 'name');
    custObj.loans = customerLoans;

    const loanIds = customerLoans.map(l => l._id);
    const customerInstallments = await Installment.find({ loanId: { $in: loanIds } }).sort({ dueDate: 1 });
    custObj.installments = customerInstallments;

    res.json(custObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    
    await customer.deleteOne();
    res.json({ message: 'Customer removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update customer details
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res) => {
  const { 
    name, email, phone, address, fatherName, motherName, spouseName, 
    childrenNames, totalChildren, aadhaarNumber, occupation, 
    monthlyIncome, homeType, permanentAddress, assets, isVerified,
    customerPhoto, aadhaarPhoto, guarantorName, guarantorPhone, guarantorRelation
  } = req.body;
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    if (name) customer.name = name;
    if (email !== undefined && email !== customer.email) {
      if (email.trim() !== '') {
        const verification = await Verification.findOne({ email, verified: true });
        if (!verification) {
          return res.status(400).json({ message: 'Email has not been verified yet. Please request and verify an OTP first.' });
        }
        await Verification.deleteOne({ email });
      }
      customer.email = email;
    }
    if (phone) {
      const existing = await Customer.findOne({ phone, _id: { $ne: customer._id } });
      if (existing) {
        return res.status(400).json({ message: 'Customer with this phone already exists' });
      }
      customer.phone = phone;
    }
    if (address) customer.address = address;
    if (fatherName !== undefined) customer.fatherName = fatherName;
    if (motherName !== undefined) customer.motherName = motherName;
    if (spouseName !== undefined) customer.spouseName = spouseName;
    if (childrenNames !== undefined) customer.childrenNames = childrenNames;
    if (totalChildren !== undefined) customer.totalChildren = totalChildren;
    if (aadhaarNumber !== undefined) customer.aadhaarNumber = aadhaarNumber;
    if (occupation !== undefined) customer.occupation = occupation;
    if (monthlyIncome !== undefined) customer.monthlyIncome = monthlyIncome;
    if (homeType !== undefined) customer.homeType = homeType;
    if (permanentAddress !== undefined) customer.permanentAddress = permanentAddress;
    if (assets !== undefined) customer.assets = assets;
    if (isVerified !== undefined) customer.isVerified = isVerified;
    if (customerPhoto !== undefined) customer.customerPhoto = customerPhoto;
    if (aadhaarPhoto !== undefined) customer.aadhaarPhoto = aadhaarPhoto;
    if (guarantorName !== undefined) customer.guarantorName = guarantorName;
    if (guarantorPhone !== undefined) customer.guarantorPhone = guarantorPhone;
    if (guarantorRelation !== undefined) customer.guarantorRelation = guarantorRelation;

    await customer.save();
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  addCustomer, 
  getCustomers, 
  getCustomerById, 
  deleteCustomer, 
  updateCustomer,
  sendOTP,
  verifyOTP
};
