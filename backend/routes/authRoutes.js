const express = require('express');
const router = express.Router();
const { loginUser, registerUser, getUsers, deleteUser, assignGroupsToEmployee, updateUserRole } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.post('/register', protect, admin, registerUser); // Only admin can create another admin
router.get('/', protect, admin, getUsers);
router.delete('/:id', protect, admin, deleteUser);
router.put('/assign-groups', protect, admin, assignGroupsToEmployee);
router.put('/:id/role', protect, admin, updateUserRole);

module.exports = router;
