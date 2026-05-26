const Loan = require('../models/Loan');
const Installment = require('../models/Installment');
const Customer = require('../models/Customer');
const Group = require('../models/Group');

// EMI Calculation (Reducing Balance)
const calculateEMI = (principal, annualRate, duration, frequency = 'Monthly') => {
  if (annualRate === 0) return principal / duration;
  const periodsPerYear = frequency === 'Weekly' ? 52 : 12;
  const r = annualRate / periodsPerYear / 100;
  const emi = (principal * r * Math.pow(1 + r, duration)) / (Math.pow(1 + r, duration) - 1);
  return emi;
};

// @desc    Create a new loan (starts as Pending)
// @route   POST /api/loans
// @access  Private
const createLoan = async (req, res) => {
  const { groupId, amount, interestRate, duration, startDate, paymentFrequency } = req.body;
  try {
    if (!groupId) {
      return res.status(400).json({ message: 'Group is required' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(400).json({ message: 'Group not found' });
    }

    const freq = paymentFrequency || 'Monthly';
    const emiAmount = calculateEMI(amount, interestRate, duration, freq);
    const totalAmount = emiAmount * duration;
    
    const sDate = startDate ? new Date(startDate) : new Date();

    const loanData = {
      groupId,
      amount,
      interestRate,
      duration,
      paymentFrequency: freq,
      emiAmount: Math.round(emiAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      startDate: sDate,
      status: 'Pending'
    };

    const loan = await Loan.create(loanData);

    res.status(201).json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLoans = async (req, res) => {
  try {
    const { status, excludeStatus } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (excludeStatus) filter.status = { $ne: excludeStatus };

    if (req.user && req.user.role !== 'Admin') {
      const Group = require('../models/Group');
      const assignedGroupIds = await Group.find({ collector: req.user._id }).distinct('_id');
      filter.groupId = { $in: assignedGroupIds };
    }

    const loans = await Loan.find(filter)
      .populate('groupId', 'name')
      .sort({ createdAt: -1 });
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
    const loan = await Loan.findById(req.params.id)
      .populate({
        path: 'groupId',
        populate: {
          path: 'members',
          select: 'name phone address'
        }
      });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    
    const installments = await Installment.find({ loanId: loan._id }).sort({ dueDate: 1 });
    
    res.json({ loan, installments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a loan and its installments
// @route   DELETE /api/loans/:id
// @access  Private
const deleteLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    // Delete associated installments
    await Installment.deleteMany({ loanId: loan._id });

    // Delete the loan
    await loan.deleteOne();

    res.json({ message: 'Loan and its installments removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve a loan request (creates installments and marks Active)
// @route   PUT /api/loans/:id/approve
// @access  Private
const approveLoan = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }

    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    if (loan.status !== 'Pending') {
      return res.status(400).json({ message: 'Loan is not in Pending status' });
    }

    loan.status = 'Active';
    await loan.save();

    // Generate Installments
    const duration = loan.duration;
    const freq = loan.paymentFrequency || 'Monthly';
    const emiAmount = loan.emiAmount;
    const sDate = loan.startDate || new Date();

    const installmentsToInsert = [];
    for (let i = 1; i <= duration; i++) {
      const dueDate = new Date(sDate);
      if (freq === 'Weekly') {
        dueDate.setDate(dueDate.getDate() + i * 7);
      } else {
        dueDate.setMonth(dueDate.getMonth() + i);
      }

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

    res.json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject a loan request
// @route   PUT /api/loans/:id/reject
// @access  Private
const rejectLoan = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }

    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    if (loan.status !== 'Pending') {
      return res.status(400).json({ message: 'Loan is not in Pending status' });
    }

    loan.status = 'Rejected';
    await loan.save();

    res.json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createLoan, getLoans, getLoanById, deleteLoan, approveLoan, rejectLoan };
