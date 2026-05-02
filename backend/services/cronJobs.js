const cron = require('node-cron');
const Installment = require('../models/Installment');
const Loan = require('../models/Loan');
const Customer = require('../models/Customer');
const { sendSMS } = require('./smsService');

// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily cron job to check installments...');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reminderDate = new Date(today);
    reminderDate.setDate(reminderDate.getDate() + 3);

    // 1. Send reminders for installments due in 3 days
    const upcomingInstallments = await Installment.find({
      status: 'Pending',
      dueDate: {
        $gte: reminderDate,
        $lt: new Date(reminderDate.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate({
      path: 'loanId',
      populate: { path: 'customerId' }
    });

    for (const inst of upcomingInstallments) {
      const customer = inst.loanId.customerId;
      if (customer && customer.phone) {
        await sendSMS(
          customer.phone,
          `Reminder: Your EMI of ${inst.remainingAmount} is due on ${inst.dueDate.toDateString()}. Please pay to avoid penalties.`
        );
      }
    }

    // 2. Mark overdue installments and apply penalty
    const overdueInstallments = await Installment.find({
      status: 'Pending',
      dueDate: { $lt: today }
    }).populate({
      path: 'loanId',
      populate: { path: 'customerId' }
    });

    for (const inst of overdueInstallments) {
      inst.status = 'Overdue';
      // Apply a fixed penalty, e.g., 50 per day overdue, or just a one-time penalty.
      // Assuming one-time flat penalty for now:
      if (inst.penalty === 0) {
        inst.penalty = 100; // Flat penalty amount
        inst.remainingAmount += 100;
        
        const customer = inst.loanId.customerId;
        if (customer && customer.phone) {
          await sendSMS(
            customer.phone,
            `Alert: Your EMI is overdue. A penalty of 100 has been added. Total due: ${inst.remainingAmount}.`
          );
        }
      }
      await inst.save();
    }

    console.log('Daily cron job completed.');
  } catch (error) {
    console.error('Error in cron job:', error);
  }
});
