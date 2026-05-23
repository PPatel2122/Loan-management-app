const Customer = require('../models/Customer');
const Otp = require('../models/Otp');
const { calculateRiskScore } = require('../services/riskScoring');
const { sendEmail } = require('../services/emailService');

// @desc    Add new customer
// @route   POST /api/customers
// @access  Private
const addCustomer = async (req, res) => {
  const { 
    name, phone, address, fatherName, motherName, spouseName, 
    childrenNames, totalChildren, aadhaarNumber, occupation, 
    monthlyIncome, homeType, permanentAddress, assets,
    customerPhoto, aadhaarPhoto, email
  } = req.body;
  try {
    let customer = await Customer.findOne({ phone });
    if (customer) {
      return res.status(400).json({ message: 'Customer with this phone already exists' });
    }
    customer = await Customer.create({ 
      name, phone, address, fatherName, motherName, spouseName, 
      childrenNames, totalChildren, aadhaarNumber, occupation, 
      monthlyIncome, homeType, permanentAddress, assets,
      customerPhoto, aadhaarPhoto, email
    });
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
    name, phone, address, fatherName, motherName, spouseName, 
    childrenNames, totalChildren, aadhaarNumber, occupation, 
    monthlyIncome, homeType, permanentAddress, assets, isVerified,
    customerPhoto, aadhaarPhoto, email
  } = req.body;
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    if (name) customer.name = name;
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
    if (email !== undefined) customer.email = email;

    await customer.save();
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate OTP and send it via email
// @route   POST /api/customers/:id/send-otp
// @access  Private
const sendOTP = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (!customer.email) {
      return res.status(400).json({ message: 'Customer does not have a registered email address' });
    }

    // Generate a 6-digit random code
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing OTP for this customer to ensure only the latest is active
    await Otp.deleteMany({ customerId: customer._id });

    // Save the new OTP
    await Otp.create({
      customerId: customer._id,
      otp: generatedOtp,
    });

    // Send email
    await sendEmail({
      to: customer.email,
      subject: 'ZenLoan - KYC OTP Verification Code',
      text: `Namaste ${customer.name},\n\nYour OTP code for ZenLoan KYC verification is: ${generatedOtp}.\n\nThis OTP is valid for 10 minutes. Please enter this code in the application to complete verification.\n\nThank you,\nZenLoan Operations Desk`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0;">
          <h2 style="color: #4f46e5; margin-bottom: 5px;">ZenLoan Verification Desk</h2>
          <p style="font-size: 14px; color: #64748b; margin-top: 0;">Joint Liability Microfinance Network</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p>Namaste <strong>${customer.name}</strong>,</p>
          <p>To verify your KYC details and activate your account registry on ZenLoan, please use the following One-Time Password (OTP) verification code:</p>
          <div style="background-color: #e0e7ff; border: 1px solid #c7d2fe; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 30px; font-weight: 850; letter-spacing: 5px; color: #4338ca;">${generatedOtp}</span>
          </div>
          <p style="font-size: 13px; color: #64748b;">This OTP code is valid for <strong>10 minutes</strong>. Do not share this OTP code with anyone.</p>
          <p style="margin-top: 25px; font-size: 14px;">Dhanyawaad,<br /><strong>ZenLoan Operations Team</strong></p>
        </div>
      `,
    });

    res.json({ message: 'OTP sent successfully to customer email' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP and mark customer verified
// @route   POST /api/customers/:id/verify-otp
// @access  Private
const verifyOTP = async (req, res) => {
  const { otp } = req.body;
  try {
    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Find valid OTP record
    const otpRecord = await Otp.findOne({
      customerId: customer._id,
      otp: otp.trim(),
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    // Mark customer as verified
    customer.isVerified = true;
    await customer.save();

    // Delete the used OTP record
    await Otp.deleteMany({ customerId: customer._id });

    // Retrieve risk scoring and send back updated customer
    const custObj = customer.toObject();
    custObj.riskAnalysis = await calculateRiskScore(custObj);

    res.json({ message: 'KYC verified successfully!', customer: custObj });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addCustomer, getCustomers, getCustomerById, deleteCustomer, updateCustomer, sendOTP, verifyOTP };
