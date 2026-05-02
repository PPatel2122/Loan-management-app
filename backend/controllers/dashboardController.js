const Loan = require('../models/Loan');
const Installment = require('../models/Installment');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const loans = await Loan.find({});
    const installments = await Installment.find({});

    const totalLoansCount = loans.length;
    const totalMoneyGiven = loans.reduce((acc, loan) => acc + loan.amount, 0);

    // Total collected: sum of (amount - remainingAmount) for all installments
    const totalCollected = installments.reduce((acc, inst) => {
      const paid = inst.amount - inst.remainingAmount + inst.penalty; // including penalty paid? let's stick to base
      return acc + (paid > 0 ? paid : 0);
    }, 0);

    const pendingAmount = installments.reduce((acc, inst) => {
      return acc + inst.remainingAmount;
    }, 0);

    // active loans
    const activeLoans = loans.filter(l => l.status === 'Active').length;
    const completedLoans = loans.filter(l => l.status === 'Completed').length;

    res.json({
      totalLoansCount,
      totalMoneyGiven,
      totalCollected,
      pendingAmount,
      activeLoans,
      completedLoans
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats };
