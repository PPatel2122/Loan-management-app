const Transaction = require('../models/Transaction');

// @desc    Get all transactions (filtered by collector if not admin)
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const filter = {};
    
    // If not admin, only show collections they made themselves
    if (req.user && req.user.role !== 'Admin') {
      filter.collectorId = req.user._id;
    }

    // Optional query parameter filters
    const { loanId } = req.query;
    if (loanId) {
      filter.loanId = loanId;
    }

    const transactions = await Transaction.find(filter)
      .populate({
        path: 'loanId',
        populate: {
          path: 'groupId',
          select: 'name'
        }
      })
      .populate('installmentId')
      .populate('collectorId', 'name username employeeId')
      .sort({ collectedDate: -1 });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate({
        path: 'loanId',
        populate: {
          path: 'groupId',
          select: 'name members'
        }
      })
      .populate('installmentId')
      .populate('collectorId', 'name username employeeId');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTransactions,
  getTransactionById
};
