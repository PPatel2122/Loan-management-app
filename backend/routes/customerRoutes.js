const express = require('express');
const router = express.Router();
const { 
  addCustomer, 
  getCustomers,
  getCustomerById,
  deleteCustomer,
  updateCustomer,
  sendOTP,
  verifyOTP
} = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, addCustomer)
  .get(protect, getCustomers);

router.route('/:id')
  .get(protect, getCustomerById)
  .put(protect, updateCustomer)
  .delete(protect, deleteCustomer);

router.post('/:id/send-otp', protect, sendOTP);
router.post('/:id/verify-otp', protect, verifyOTP);

module.exports = router;
