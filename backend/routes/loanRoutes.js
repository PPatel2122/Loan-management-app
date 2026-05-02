const express = require('express');
const router = express.Router();
const { createLoan, getLoans, getLoanById } = require('../controllers/loanController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createLoan)
  .get(protect, getLoans);

router.get('/:id', protect, getLoanById);

module.exports = router;
