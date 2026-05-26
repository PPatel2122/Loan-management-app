const express = require('express');
const router = express.Router();
const { createLoan, getLoans, getLoanById, deleteLoan, approveLoan, rejectLoan } = require('../controllers/loanController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createLoan)
  .get(protect, getLoans);

router.route('/:id')
  .get(protect, getLoanById)
  .delete(protect, deleteLoan);

router.put('/:id/approve', protect, approveLoan);
router.put('/:id/reject', protect, rejectLoan);


module.exports = router;
