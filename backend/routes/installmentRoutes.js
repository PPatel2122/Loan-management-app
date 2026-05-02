const express = require('express');
const router = express.Router();
const { updateInstallment, getInstallments } = require('../controllers/installmentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getInstallments);

router.put('/:id', protect, updateInstallment);

module.exports = router;
