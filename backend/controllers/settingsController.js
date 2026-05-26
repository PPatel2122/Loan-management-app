const Settings = require('../models/Settings');

// @desc    Get system settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({});
    if (!settings) {
      // Create defaults
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }

    let settings = await Settings.findOne({});
    if (!settings) {
      settings = new Settings();
    }

    const { companyName, interestRate, penaltyRate, supportPhone } = req.body;

    if (companyName !== undefined) settings.companyName = companyName;
    if (interestRate !== undefined) settings.interestRate = interestRate;
    if (penaltyRate !== undefined) settings.penaltyRate = penaltyRate;
    if (supportPhone !== undefined) settings.supportPhone = supportPhone;

    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSettings, updateSettings };
