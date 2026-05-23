const User = require('../models/User');
const Group = require('../models/Group');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const registerUser = async (req, res) => {
  const { name, email, phone, username, password, role } = req.body;
  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = await User.create({ name, email, phone, username, password, role });
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete yourself' });
    }
    // Clear collector status on any groups assigned to this deleted user
    await Group.updateMany({ collector: user._id }, { $set: { collector: null } });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const assignGroupsToEmployee = async (req, res) => {
  const { employeeId, groupIds } = req.body;
  try {
    if (!employeeId) {
      return res.status(400).json({ message: 'Employee ID is required' });
    }
    if (!Array.isArray(groupIds)) {
      return res.status(400).json({ message: 'Group IDs must be an array' });
    }

    // 1. Unassign all groups currently assigned to this employee
    await Group.updateMany({ collector: employeeId }, { $set: { collector: null } });

    // 2. Assign the selected groups to this employee
    if (groupIds.length > 0) {
      await Group.updateMany({ _id: { $in: groupIds } }, { $set: { collector: employeeId } });
    }

    res.json({ message: 'Groups assigned successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUserRole = async (req, res) => {
  const { role } = req.body;
  try {
    if (!role || !['Admin', 'Employee'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be Admin or Employee' });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    
    // Clear assigned groups if the role changes to Admin
    if (role === 'Admin') {
      await Group.updateMany({ collector: user._id }, { $set: { collector: null } });
    }

    await user.save();
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { loginUser, registerUser, getUsers, deleteUser, assignGroupsToEmployee, updateUserRole };
