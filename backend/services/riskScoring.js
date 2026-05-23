const Group = require('../models/Group');
const Loan = require('../models/Loan');
const Installment = require('../models/Installment');

/**
 * Calculates a Credit Risk Score and Grade for a customer.
 * Risk Score is out of 100 points, mapped to Grade A, B, C, or D.
 * 
 * Factors:
 * 1. Income Stability (Max 30 points)
 * 2. Residential Stability (Max 25 points)
 * 3. Collateral Strength (Max 25 points)
 * 4. Occupational Factor (Max 20 points)
 * 5. Joint Liability Group Penalty (Deducts 20 points if co-debtors have Overdue loans)
 */
const calculateRiskScore = async (customer) => {
  if (!customer) {
    return { score: 0, grade: 'D', factors: { income: 0, home: 0, assets: 0, occupation: 0, penalty: 0 } };
  }

  let incomePoints = 5;
  const income = parseFloat(customer.monthlyIncome) || 0;
  if (income >= 25000) {
    incomePoints = 30;
  } else if (income >= 15000) {
    incomePoints = 20;
  } else if (income >= 7500) {
    incomePoints = 10;
  }

  let homePoints = 5;
  const homeType = (customer.homeType || '').trim();
  if (homeType.toLowerCase() === 'own house') {
    homePoints = 25;
  } else if (homeType.toLowerCase() === 'rented house') {
    homePoints = 15;
  }

  let assetPoints = 5;
  const assets = (customer.assets || '').trim();
  if (assets.length >= 3) {
    assetPoints = 25;
  }

  let occupationPoints = 5;
  const occupation = (customer.occupation || '').trim();
  if (occupation.length >= 3) {
    occupationPoints = 20;
  }

  let penaltyPoints = 0;
  let hasGroupOverdue = false;

  try {
    // Look up group that contains this member
    const group = await Group.findOne({ members: customer._id });
    if (group) {
      // Find active loans for this group
      const activeLoans = await Loan.find({ groupId: group._id, status: 'Active' });
      if (activeLoans && activeLoans.length > 0) {
        const loanIds = activeLoans.map(l => l._id);
        
        // Find if there are any Overdue installments for these group loans
        const overdueInstallment = await Installment.findOne({
          loanId: { $in: loanIds },
          status: 'Overdue'
        });

        if (overdueInstallment) {
          penaltyPoints = 20; // joint liability peer delinquency penalty
          hasGroupOverdue = true;
        }
      }
    }
  } catch (err) {
    console.error('Error calculating joint liability peer penalty:', err);
  }

  // Calculate overall score (bounded between 0 and 100)
  const rawScore = incomePoints + homePoints + assetPoints + occupationPoints - penaltyPoints;
  const score = Math.max(0, Math.min(100, rawScore));

  // Determine Credit Risk Grade
  let grade = 'D';
  if (score >= 80) {
    grade = 'A';
  } else if (score >= 60) {
    grade = 'B';
  } else if (score >= 40) {
    grade = 'C';
  }

  return {
    score,
    grade,
    factors: {
      income: { points: incomePoints, rating: incomePoints >= 20 ? 'Strong' : (incomePoints >= 10 ? 'Moderate' : 'Low') },
      home: { points: homePoints, rating: homePoints === 25 ? 'Stable' : (homePoints === 15 ? 'Moderate' : 'Unspecified') },
      assets: { points: assetPoints, rating: assetPoints === 25 ? 'Verified' : 'None Declared' },
      occupation: { points: occupationPoints, rating: occupationPoints === 20 ? 'Stable' : 'Unspecified' },
      penalty: { points: penaltyPoints, active: hasGroupOverdue, reason: hasGroupOverdue ? 'Co-debtor peer delinquency' : 'None' }
    }
  };
};

module.exports = { calculateRiskScore };
