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

router.post('/send-otp', protect, sendOTP);
router.post('/verify-otp', protect, verifyOTP);

router.route('/')
  .post(protect, addCustomer)
  .get(protect, getCustomers);

router.route('/:id')
  .get(protect, getCustomerById)
  .put(protect, updateCustomer)
  .delete(protect, deleteCustomer);

module.exports = router;
