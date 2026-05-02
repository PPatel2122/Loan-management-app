const Loan = require('../models/Loan');
const Installment = require('../models/Installment');
const Customer = require('../models/Customer');

// EMI Calculation (Reducing Balance)
const calculateEMI = (principal, annualRate, months) => {
  if (annualRate === 0) return principal / months;
  const r = annualRate / 12 / 100;
  const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return emi;
};

// @desc    Create a new loan
// @route   POST /api/loans
// @access  Private
const createLoan = async (req, res) => {
  const { customerId, amount, interestRate, duration, startDate } = req.body;
  try {
    const customer = await Customer.findById(customerId);
    if (!customer || !customer.isVerified) {
      return res.status(400).json({ message: 'Verified customer required' });
    }

    const emiAmount = calculateEMI(amount, interestRate, duration);
    const totalAmount = emiAmount * duration;
    
    const sDate = startDate ? new Date(startDate) : new Date();

    const loan = await Loan.create({
      customerId,
      amount,
      interestRate,
      duration,
      emiAmount: Math.round(emiAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      startDate: sDate,
      status: 'Active'
    });

    // Generate Installments
    const installmentsToInsert = [];
    for (let i = 1; i <= duration; i++) {
      const dueDate = new Date(sDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      installmentsToInsert.push({
        loanId: loan._id,
        dueDate,
        amount: Math.round(emiAmount * 100) / 100,
        remainingAmount: Math.round(emiAmount * 100) / 100,
        status: 'Pending',
        penalty: 0
      });
    }

    await Installment.insertMany(installmentsToInsert);

    res.status(201).json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all loans
// @route   GET /api/loans
// @access  Private
const getLoans = async (req, res) => {
  try {
    const { status, excludeStatus } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (excludeStatus) filter.status = { $ne: excludeStatus };

    const loans = await Loan.find(filter).populate('customerId', 'name phone').sort({ createdAt: -1 });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single loan with installments
// @route   GET /api/loans/:id
// @access  Private
const getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('customerId', 'name phone address');
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    
    const installments = await Installment.find({ loanId: loan._id }).sort({ dueDate: 1 });
    
    res.json({ loan, installments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createLoan, getLoans, getLoanById };
