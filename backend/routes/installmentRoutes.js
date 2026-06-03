const express = require('express');
const router = express.Router();
const { updateInstallment, getInstallments, bulkCollectInstallments, collectLoanPayment } = require('../controllers/installmentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getInstallments);

router.post('/bulk-collect', protect, bulkCollectInstallments);
router.post('/loan-payment', protect, collectLoanPayment);

router.put('/:id', protect, updateInstallment);

module.exports = router;
