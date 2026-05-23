const Group = require('../models/Group');
const Customer = require('../models/Customer');
const { calculateRiskScore } = require('../services/riskScoring');

// Helper to calculate risk scoring for all group members in populated documents
const processGroupMembers = async (groupDoc) => {
  if (!groupDoc) return null;
  const groupObj = groupDoc.toObject();
  if (groupObj.members && groupObj.members.length > 0) {
    for (let i = 0; i < groupObj.members.length; i++) {
      const member = groupObj.members[i];
      if (member && member._id) {
        member.riskAnalysis = await calculateRiskScore(member);
      }
    }
  }
  return groupObj;
};

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
const createGroup = async (req, res) => {
  const { name, members } = req.body;
  try {
    if (!name || !members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: 'Group name and at least one member are required' });
    }

    let group = await Group.findOne({ name });
    if (group) {
      return res.status(400).json({ message: 'Group with this name already exists' });
    }

    const memberIds = [];

    for (const member of members) {
      if (typeof member === 'string') {
        // Existing customer ID
        memberIds.push(member);
      } else if (member && typeof member === 'object') {
        // New customer details
        const { name: custName, phone, address } = member;
        if (!custName || !phone || !address) {
          return res.status(400).json({ message: 'All details (name, phone, address) are required for all members' });
        }

        // Check if phone already exists
        let customer = await Customer.findOne({ phone });
        if (!customer) {
          customer = await Customer.create(member);
        }
        memberIds.push(customer._id);
      }
    }

    group = await Group.create({ name, members: memberIds });
    const populated = await Group.findById(group._id).populate('members').populate('collector', 'name username');
    const processed = await processGroupMembers(populated);
    res.status(201).json(processed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all groups
// @route   GET /api/groups
// @access  Private
const getGroups = async (req, res) => {
  try {
    const query = {};
    if (req.user && req.user.role !== 'Admin') {
      query.collector = req.user._id;
    }
    const rawGroups = await Group.find(query)
      .populate('members')
      .populate('collector', 'name username')
      .sort({ createdAt: -1 });
    const groups = [];
    for (const g of rawGroups) {
      groups.push(await processGroupMembers(g));
    }
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get group by ID
// @route   GET /api/groups/:id
// @access  Private
const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members')
      .populate('collector', 'name username');
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const processed = await processGroupMembers(group);
    res.json(processed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete group
// @route   DELETE /api/groups/:id
// @access  Private
const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Check if group has active loans
    const Loan = require('../models/Loan');
    const activeLoans = await Loan.findOne({ groupId: group._id, status: 'Active' });
    if (activeLoans) {
      return res.status(400).json({ message: 'Cannot delete a group with active loans' });
    }

    await group.deleteOne();
    res.json({ message: 'Group removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update group
// @route   PUT /api/groups/:id
// @access  Private
const updateGroup = async (req, res) => {
  const { name, members } = req.body;
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (name) {
      const existing = await Group.findOne({ name, _id: { $ne: group._id } });
      if (existing) {
        return res.status(400).json({ message: 'Group with this name already exists' });
      }
      group.name = name;
    }

    if (members && Array.isArray(members)) {
      const memberIds = [];
      for (const member of members) {
        if (typeof member === 'string') {
          memberIds.push(member);
        } else if (member && typeof member === 'object') {
          const { name: custName, phone, address } = member;
          if (!custName || !phone || !address) {
            return res.status(400).json({ message: 'All details (name, phone, address) are required for all members' });
          }
          let customer = await Customer.findOne({ phone });
          if (!customer) {
            customer = await Customer.create(member);
          }
          memberIds.push(customer._id);
        }
      }
      group.members = memberIds;
    }

    await group.save();
    const updatedGroup = await Group.findById(group._id).populate('members').populate('collector', 'name username');
    const processed = await processGroupMembers(updatedGroup);
    res.json(processed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get group collection sheet (due installments split equally per member)
// @route   GET /api/groups/:id/collection-sheet
// @access  Private
const getGroupCollectionSheet = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('members');
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const Loan = require('../models/Loan');
    const Installment = require('../models/Installment');

    const activeLoans = await Loan.find({ groupId: group._id, status: 'Active' });
    const sheetLoans = [];

    const numMembers = group.members.length || 1;

    for (const loan of activeLoans) {
      // Find oldest pending or overdue installment
      const nextInstallment = await Installment.findOne({
        loanId: loan._id,
        status: { $in: ['Pending', 'Overdue'] }
      }).sort({ dueDate: 1 });

      if (nextInstallment) {
        const totalDue = nextInstallment.remainingAmount + nextInstallment.penalty;
        const sharePerMember = Math.round((totalDue / numMembers) * 100) / 100;

        sheetLoans.push({
          loanId: loan._id,
          amount: loan.amount,
          interestRate: loan.interestRate,
          duration: loan.duration,
          paymentFrequency: loan.paymentFrequency || 'Monthly',
          nextInstallment: {
            installmentId: nextInstallment._id,
            dueDate: nextInstallment.dueDate,
            amount: nextInstallment.amount,
            penalty: nextInstallment.penalty,
            remainingAmount: nextInstallment.remainingAmount,
            totalDue,
            status: nextInstallment.status,
            sharePerMember
          }
        });
      }
    }

    res.json({
      groupId: group._id,
      groupName: group.name,
      members: group.members.map(m => ({
        _id: m._id,
        name: m.name,
        phone: m.phone
      })),
      activeLoans: sheetLoans
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  createGroup, 
  getGroups, 
  getGroupById, 
  deleteGroup, 
  updateGroup, 
  getGroupCollectionSheet 
};
