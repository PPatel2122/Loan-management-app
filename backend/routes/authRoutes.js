const express = require('express');
const router = express.Router();
const { loginUser, registerUser, getUsers, deleteUser } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.post('/register', protect, admin, registerUser); // Only admin can create another admin
router.get('/', protect, admin, getUsers);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;
