const express = require('express');
const router = express.Router();
const { getTransactions, getTransactionById } = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getTransactions);

router.route('/:id')
  .get(protect, getTransactionById);

module.exports = router;
