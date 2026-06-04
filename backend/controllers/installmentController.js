const Installment = require('../models/Installment');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');

// @desc    Update an installment (mark paid, partial pay, remove penalty)
// @route   PUT /api/installments/:id
// @access  Private
const updateInstallment = async (req, res) => {
  const { status, penalty, remainingAmount, paidDate, nonPaymentReason, paymentMode } = req.body;
  try {
    const installment = await Installment.findById(req.params.id);
    if (!installment) return res.status(404).json({ message: 'Installment not found' });

    const previousPenalty = installment.penalty || 0;
    const previousRemainingAmount = installment.remainingAmount || 0;
    const previousTotalDue = previousRemainingAmount + previousPenalty;

    if (status) installment.status = status;
    if (penalty !== undefined) installment.penalty = penalty;
    if (nonPaymentReason !== undefined) installment.nonPaymentReason = nonPaymentReason;
    
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

    // Record payment Transaction
    const newPenalty = installment.penalty || 0;
    const newRemainingAmount = installment.remainingAmount || 0;
    const newTotalDue = newRemainingAmount + newPenalty;

    const amountPaid = req.body.amountPaid !== undefined ? parseFloat(req.body.amountPaid) : (previousTotalDue - newTotalDue);
    let txn = null;

    if (amountPaid > 0) {
      txn = await Transaction.create({
        loanId: installment.loanId,
        installmentId: installment._id,
        collectorId: req.user._id,
        amount: amountPaid,
        paymentMode: req.body.paymentMode || 'Cash'
      });

      txn = await Transaction.findById(txn._id)
        .populate({
          path: 'loanId',
          populate: { path: 'groupId', select: 'name' }
        })
        .populate('collectorId', 'name username employeeId');
    }

    const resultObj = installment.toObject();
    if (txn) {
      resultObj.transaction = txn.toObject();
    }

    res.json(resultObj);
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

    const installments = await Installment.find(filter)
      .populate({
        path: 'loanId',
        populate: {
          path: 'groupId',
          populate: {
            path: 'members'
          }
        }
      })
      .sort({ dueDate: 1 });
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
      const { installmentId, collectedAmount, paymentMode } = payment;
      const installment = await Installment.findById(installmentId);
      
      if (installment) {
        loanIdsToCheck.add(installment.loanId.toString());

        let amt = parseFloat(collectedAmount) || 0;
        const initialAmt = amt;
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

        // Record payment Transaction
        if (initialAmt > 0) {
          await Transaction.create({
            loanId: installment.loanId,
            installmentId: installment._id,
            collectorId: req.user._id,
            amount: initialAmt,
            paymentMode: paymentMode || req.body.paymentMode || 'Cash'
          });
        }
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

const collectLoanPayment = async (req, res) => {
  const { loanId, paymentAmount } = req.body;
  try {
    if (!loanId) {
      return res.status(400).json({ message: 'Loan ID is required' });
    }
    const amtToApply = parseFloat(paymentAmount);
    if (isNaN(amtToApply) || amtToApply <= 0) {
      return res.status(400).json({ message: 'Payment amount must be greater than zero' });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Find all unpaid or partially paid installments for this loan, sorted by due date
    const unpaidInstallments = await Installment.find({
      loanId,
      status: { $ne: 'Paid' }
    }).sort({ dueDate: 1 });

    if (unpaidInstallments.length === 0) {
      return res.status(400).json({ message: 'All installments for this loan are already paid' });
    }

    let remainingPayment = amtToApply;
    const updated = [];

    for (const inst of unpaidInstallments) {
      if (remainingPayment <= 0) break;

      const totalDue = inst.remainingAmount + inst.penalty;

      if (remainingPayment >= totalDue) {
        // This installment is fully covered
        remainingPayment -= totalDue;
        inst.remainingAmount = 0;
        inst.penalty = 0;
        inst.status = 'Paid';
        inst.paidDate = new Date();
      } else {
        // Partially covered: pay off penalty first, then the remaining principal
        if (inst.penalty > 0) {
          const penaltyPaid = Math.min(inst.penalty, remainingPayment);
          inst.penalty -= penaltyPaid;
          remainingPayment -= penaltyPaid;
        }

        if (remainingPayment > 0) {
          inst.remainingAmount = Math.max(0, inst.remainingAmount - remainingPayment);
          remainingPayment = 0;
        }

        if (inst.remainingAmount <= 0) {
          inst.status = 'Paid';
          inst.paidDate = new Date();
        }
      }

      await inst.save();
      updated.push(inst);
    }

    // Check if the loan is fully completed now
    const allInstallments = await Installment.find({ loanId });
    const allPaid = allInstallments.every(inst => inst.status === 'Paid');
    if (allPaid) {
      loan.status = 'Completed';
      await loan.save();
    }

    const appliedAmount = amtToApply - remainingPayment;
    let txn = null;

    if (appliedAmount > 0) {
      txn = await Transaction.create({
        loanId,
        collectorId: req.user._id,
        amount: appliedAmount,
        paymentMode: req.body.paymentMode || 'Cash'
      });
    }

    res.json({
      message: 'Bulk payment processed successfully',
      appliedAmount,
      changeReturned: remainingPayment,
      installmentsUpdated: updated.length,
      loanStatus: loan.status,
      transaction: txn
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  updateInstallment, 
  getInstallments, 
  bulkCollectInstallments,
  collectLoanPayment
};
