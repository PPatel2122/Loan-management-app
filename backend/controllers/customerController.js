const Customer = require('../models/Customer');
// @desc    Add new customer
// @route   POST /api/customers
// @access  Private
const addCustomer = async (req, res) => {
  const { name, phone, address } = req.body;
  try {
    let customer = await Customer.findOne({ phone });
    if (customer) {
      return res.status(400).json({ message: 'Customer with this phone already exists' });
    }
    customer = await Customer.create({ name, phone, address });
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({}).sort({ createdAt: -1 });
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
    res.json(customer);
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

module.exports = { addCustomer, getCustomers, getCustomerById, deleteCustomer };
