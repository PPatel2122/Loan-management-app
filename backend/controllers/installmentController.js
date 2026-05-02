const Installment = require('../models/Installment');
const Loan = require('../models/Loan');

// @desc    Update an installment (mark paid, partial pay, remove penalty)
// @route   PUT /api/installments/:id
// @access  Private
const updateInstallment = async (req, res) => {
  const { status, penalty, remainingAmount, paidDate } = req.body;
  try {
    const installment = await Installment.findById(req.params.id);
    if (!installment) return res.status(404).json({ message: 'Installment not found' });

    if (status) installment.status = status;
    if (penalty !== undefined) installment.penalty = penalty;
    
    if (remainingAmount !== undefined) {
      installment.remainingAmount = remainingAmount;
      if (remainingAmount <= 0) {
        installment.status = 'Paid';
      }
    }

    if (installment.status === 'Paid' && !installment.paidDate) {
      installment.paidDate = paidDate ? new Date(paidDate) : new Date();
    } else if (installment.status !== 'Paid') {
      installment.paidDate = undefined;
    }

    await installment.save();

    // Check if all installments are paid to mark loan as completed
    if (installment.status === 'Paid') {
      const allInstallments = await Installment.find({ loanId: installment.loanId });
      const allPaid = allInstallments.every(inst => inst.status === 'Paid');
      if (allPaid) {
        await Loan.findByIdAndUpdate(installment.loanId, { status: 'Completed' });
      }
    }

    res.json(installment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all installments
// @route   GET /api/installments
// @access  Private
const getInstallments = async (req, res) => {
  try {
    const installments = await Installment.find({}).populate('loanId').sort({ dueDate: 1 });
    res.json(installments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { updateInstallment, getInstallments };
