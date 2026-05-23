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

const getInstallments = async (req, res) => {
  try {
    let filter = {};
    if (req.user && req.user.role !== 'Admin') {
      const Group = require('../models/Group');
      const assignedGroupIds = await Group.find({ collector: req.user._id }).distinct('_id');
      const loanIds = await Loan.find({ groupId: { $in: assignedGroupIds } }).distinct('_id');
      filter = { loanId: { $in: loanIds } };
    }

    const installments = await Installment.find(filter).populate('loanId').sort({ dueDate: 1 });
    res.json(installments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk record collections / payments for group installments
// @route   POST /api/installments/bulk-collect
// @access  Private
const bulkCollectInstallments = async (req, res) => {
  const { payments } = req.body; // Array of { installmentId, collectedAmount }
  try {
    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ message: 'Payments list is required' });
    }

    const updatedInstallments = [];
    const loanIdsToCheck = new Set();

    for (const payment of payments) {
      const { installmentId, collectedAmount } = payment;
      const installment = await Installment.findById(installmentId);
      
      if (installment) {
        loanIdsToCheck.add(installment.loanId.toString());

        let amt = parseFloat(collectedAmount) || 0;
        const totalDue = installment.remainingAmount + installment.penalty;

        if (amt >= totalDue) {
          // Fully paid
          installment.remainingAmount = 0;
          installment.penalty = 0;
          installment.status = 'Paid';
          installment.paidDate = new Date();
        } else {
          // Partially paid: pay off penalty first, then the remaining principal
          if (installment.penalty > 0) {
            const penaltyPaid = Math.min(installment.penalty, amt);
            installment.penalty -= penaltyPaid;
            amt -= penaltyPaid;
          }

          if (amt > 0) {
            installment.remainingAmount = Math.max(0, installment.remainingAmount - amt);
          }

          if (installment.remainingAmount <= 0) {
            installment.status = 'Paid';
            installment.paidDate = new Date();
          }
        }

        await installment.save();
        updatedInstallments.push(installment);
      }
    }

    // Post-update: check if loans are completed
    for (const loanId of loanIdsToCheck) {
      const allInstallments = await Installment.find({ loanId });
      const allPaid = allInstallments.every(inst => inst.status === 'Paid');
      if (allPaid) {
        await Loan.findByIdAndUpdate(loanId, { status: 'Completed' });
      }
    }

    res.json({ message: 'Bulk payments recorded successfully', count: updatedInstallments.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { updateInstallment, getInstallments, bulkCollectInstallments };
