const Customer = require('../models/Customer');
const { calculateRiskScore } = require('../services/riskScoring');

// @desc    Add new customer
// @route   POST /api/customers
// @access  Private
const addCustomer = async (req, res) => {
  const { 
    name, phone, address, fatherName, motherName, spouseName, 
    childrenNames, totalChildren, aadhaarNumber, occupation, 
    monthlyIncome, homeType, permanentAddress, assets 
  } = req.body;
  try {
    let customer = await Customer.findOne({ phone });
    if (customer) {
      return res.status(400).json({ message: 'Customer with this phone already exists' });
    }
    customer = await Customer.create({ 
      name, phone, address, fatherName, motherName, spouseName, 
      childrenNames, totalChildren, aadhaarNumber, occupation, 
      monthlyIncome, homeType, permanentAddress, assets 
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
    monthlyIncome, homeType, permanentAddress, assets, isVerified 
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

    await customer.save();
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addCustomer, getCustomers, getCustomerById, deleteCustomer, updateCustomer };
