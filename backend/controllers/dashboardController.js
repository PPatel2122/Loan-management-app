const Loan = require('../models/Loan');
const Installment = require('../models/Installment');
const Group = require('../models/Group');
const Customer = require('../models/Customer');
const User = require('../models/User');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const isAdmin = req.user && req.user.role === 'Admin';

    if (isAdmin) {
      // ==========================================
      // ADMIN DASHBOARD STATISTICS
      // ==========================================
      const today = new Date();
      
      // Get counts
      const totalGroupsCount = await Group.countDocuments({});
      const totalMembersCount = await Customer.countDocuments({});
      const totalLoansCount = await Loan.countDocuments({});

      // Fetch installments in last 6 months for profit and daily charts
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const chartInstallments = await Installment.find({
        paidDate: { $gte: sixMonthsAgo }
      }).populate('loanId', 'amount totalAmount');

      // Aggregate overall total collection and pending EMI entirely in DB
      const totalCollectionResult = await Installment.aggregate([
        {
          $project: {
            paid: { $subtract: ["$amount", "$remainingAmount"] },
            penalty: { $ifNull: ["$penalty", 0] }
          }
        },
        {
          $group: {
            _id: null,
            totalPaid: { $sum: { $cond: [{ $gt: ["$paid", 0] }, "$paid", 0] } },
            totalPenalty: { $sum: "$penalty" }
          }
        }
      ]);
      const totalCollection = (totalCollectionResult[0]?.totalPaid || 0) + (totalCollectionResult[0]?.totalPenalty || 0);

      const pendingEmiResult = await Installment.aggregate([
        { $match: { status: { $ne: 'Paid' } } },
        { $group: { _id: null, total: { $sum: "$remainingAmount" } } }
      ]);
      const pendingEmiAmount = pendingEmiResult[0]?.total || 0;

      // Overdue Loans: active loans with at least one unpaid installment past its due date
      const overdueLoansCount = await Loan.countDocuments({
        status: 'Active',
        _id: {
          $in: await Installment.find({
            status: { $ne: 'Paid' },
            dueDate: { $lt: today }
          }).distinct('loanId')
        }
      });

      // 1. Daily Collection Chart (last 7 days)
      const dailyCollectionData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        // Sum collections received on this specific day (paidDate matches)
        const dayPaid = chartInstallments.reduce((acc, inst) => {
          if (inst.paidDate) {
            const instPaidDateStr = new Date(inst.paidDate).toISOString().split('T')[0];
            if (instPaidDateStr === dateStr) {
              const paid = inst.amount - inst.remainingAmount;
              return acc + (paid > 0 ? paid : 0) + (inst.penalty || 0);
            }
          }
          return acc;
        }, 0);

        dailyCollectionData.push({
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount: dayPaid
        });
      }

      // 2. Monthly Profit Chart (last 6 months)
      // Profit is calculated as the interest portion of collections
      const monthlyProfitData = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const year = d.getFullYear();
        const month = d.getMonth(); // 0-11
        const monthName = d.toLocaleDateString('en-US', { month: 'short' });
        
        const monthInterest = chartInstallments.reduce((acc, inst) => {
          if (inst.paidDate && inst.loanId) {
            const pDate = new Date(inst.paidDate);
            if (pDate.getFullYear() === year && pDate.getMonth() === month) {
              const paid = inst.amount - inst.remainingAmount;
              const loan = inst.loanId;
              const totalAmount = loan.totalAmount || 1;
              const principal = loan.amount || 1;
              const profitRatio = (totalAmount - principal) / totalAmount;
              return acc + (paid > 0 ? paid * profitRatio : 0);
            }
          }
          return acc;
        }, 0);

        monthlyProfitData.push({
          month: monthName,
          profit: Math.round(monthInterest)
        });
      }

      // 3. Employee Performance
      const employees = await User.find({ role: 'Employee' });
      const employeePerformance = [];
      
      for (const emp of employees) {
        const empGroups = await Group.find({ collector: emp._id });
        const empGroupIds = empGroups.map(g => g._id);
        const empLoans = await Loan.find({ groupId: { $in: empGroupIds } });
        const empLoanIds = empLoans.map(l => l._id);
        
        const empInstallments = await Installment.find({ loanId: { $in: empLoanIds } });
        
        const target = empInstallments.reduce((acc, inst) => acc + inst.amount, 0);
        const actual = empInstallments.reduce((acc, inst) => {
          const paid = inst.amount - inst.remainingAmount;
          return acc + (paid > 0 ? paid : 0);
        }, 0);

        employeePerformance.push({
          _id: emp._id,
          name: emp.name,
          username: emp.username,
          groupsCount: empGroups.length,
          activeLoansCount: empLoans.filter(l => l.status === 'Active').length,
          targetCollection: target,
          actualCollection: actual,
          efficiency: target > 0 ? Math.round((actual / target) * 100) : 0
        });
      }

      res.json({
        role: 'Admin',
        totalLoansCount,
        totalCollection,
        pendingEmiAmount,
        overdueLoansCount,
        totalGroupsCount,
        totalMembersCount,
        dailyCollectionData,
        monthlyProfitData,
        employeePerformance
      });

    } else {
      // ==========================================
      // EMPLOYEE DASHBOARD STATISTICS
      // ==========================================
      const assignedGroups = await Group.find({ collector: req.user._id }).populate('members');
      const assignedGroupIds = assignedGroups.map(g => g._id);
      
      const loans = await Loan.find({ groupId: { $in: assignedGroupIds } }).populate('groupId');
      const loanIds = loans.map(l => l._id);
      
      const installments = await Installment.find({ loanId: { $in: loanIds } }).populate({
        path: 'loanId',
        populate: { path: 'groupId' }
      });

      // 1. Assigned Groups
      const assignedGroupsCount = assignedGroups.length;

      // 2. Today Collection (due today)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const todayInstallments = installments.filter(inst => {
        const d = new Date(inst.dueDate);
        return d >= todayStart && d <= todayEnd;
      });

      const todayCollectionTarget = todayInstallments.reduce((acc, inst) => acc + inst.amount, 0);
      const todayCollectionActual = todayInstallments.reduce((acc, inst) => {
        const paid = inst.amount - inst.remainingAmount;
        return acc + (paid > 0 ? paid : 0);
      }, 0);

      // 3. Pending Collection (unpaid/partially paid installments due in the past or today)
      const pendingCollection = installments.reduce((acc, inst) => {
        const isPastOrToday = new Date(inst.dueDate) <= todayEnd;
        if (isPastOrToday && inst.status !== 'Paid') {
          return acc + inst.remainingAmount;
        }
        return acc;
      }, 0);

      // 4. Upcoming EMI (due in the next 7 days, excluding today)
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      sevenDaysLater.setHours(23, 59, 59, 999);

      const upcomingEmiInstallments = installments.filter(inst => {
        const d = new Date(inst.dueDate);
        return d > todayEnd && d <= sevenDaysLater && inst.status !== 'Paid';
      });

      const upcomingEmi = upcomingEmiInstallments.map(inst => ({
        _id: inst._id,
        dueDate: inst.dueDate,
        amount: inst.remainingAmount,
        groupName: inst.loanId?.groupId?.name || 'Unknown Group',
        paymentFrequency: inst.loanId?.paymentFrequency || 'Monthly'
      })).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

      // 5. Recent Activity (recent payments collected - paidDate not null, sorted descending)
      const recentCollected = installments
        .filter(inst => inst.paidDate)
        .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))
        .slice(0, 10)
        .map(inst => ({
          _id: inst._id,
          paidDate: inst.paidDate,
          amountPaid: inst.amount - inst.remainingAmount + (inst.penalty || 0),
          groupName: inst.loanId?.groupId?.name || 'Unknown Group',
          dueDate: inst.dueDate
        }));

      res.json({
        role: 'Employee',
        assignedGroupsCount,
        todayCollectionTarget,
        todayCollectionActual,
        pendingCollection,
        upcomingEmi,
        recentActivity: recentCollected
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats };
