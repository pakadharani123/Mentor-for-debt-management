/**
 * Financial Health Score Calculator Service
 * Evaluates user's financial posture and returns a risk score from 0 (Perfect) to 100 (Extremely Vulnerable)
 */
class HealthScoreService {
  /**
   * Calculate score based on inputs
   * @param {Number} income - Monthly income
   * @param {Number} expenses - Monthly expenses
   * @param {Number} emergencyFund - Available emergency savings
   * @param {Number} totalEMI - Sum of all loan EMIs
   * @param {Number} loanCount - Number of active loans
   */
  static calculateScore({ income, expenses, emergencyFund, totalEMI, loanCount }) {
    // Prevent Division by Zero
    const monthlyIncome = Math.max(1, income);
    const monthlyExpenses = Math.max(1, expenses);

    // 1. Debt-to-Income (DTI) Ratio - Max 40 points
    // DTI = (totalEMI / monthlyIncome) * 100
    const dti = (totalEMI / monthlyIncome) * 100;
    let dtiPoints = 0;
    let dtiStatus = 'Healthy';

    if (dti <= 20) {
      dtiPoints = 0;
      dtiStatus = 'Excellent';
    } else if (dti <= 35) {
      dtiPoints = 15;
      dtiStatus = 'Healthy';
    } else if (dti <= 50) {
      dtiPoints = 30;
      dtiStatus = 'Moderate Risk';
    } else {
      dtiPoints = 40;
      dtiStatus = 'High Risk';
    }

    // 2. Active Loan Count - Max 20 points
    let loanPoints = 0;
    let loanStatus = 'Healthy';

    if (loanCount <= 1) {
      loanPoints = 0;
      loanStatus = 'Healthy';
    } else if (loanCount === 2) {
      loanPoints = 5;
      loanStatus = 'Low Risk';
    } else if (loanCount <= 4) {
      loanPoints = 12;
      loanStatus = 'Moderate Risk';
    } else {
      loanPoints = 20;
      loanStatus = 'High Risk';
    }

    // 3. Emergency Fund Sufficiency - Max 20 points
    // How many months of expenses are covered?
    const efMonths = emergencyFund / monthlyExpenses;
    let efPoints = 0;
    let efStatus = 'Healthy';

    if (efMonths >= 6) {
      efPoints = 0;
      efStatus = 'Excellent';
    } else if (efMonths >= 3) {
      efPoints = 5;
      efStatus = 'Healthy';
    } else if (efMonths >= 1) {
      efPoints = 12;
      efStatus = 'Low Reserve';
    } else {
      efPoints = 20;
      efStatus = 'Critical Lack of Savings';
    }

    // 4. Monthly Surplus Ratio - Max 20 points
    // Surplus = Income - Expenses - EMI
    const surplus = monthlyIncome - monthlyExpenses - totalEMI;
    const surplusRatio = (surplus / monthlyIncome) * 100;
    let surplusPoints = 0;
    let surplusStatus = 'Healthy';

    if (surplusRatio >= 20) {
      surplusPoints = 0;
      surplusStatus = 'Excellent';
    } else if (surplusRatio >= 10) {
      surplusPoints = 5;
      surplusStatus = 'Healthy';
    } else if (surplusRatio >= 0) {
      surplusPoints = 12;
      surplusStatus = 'Low Savings Rate';
    } else {
      surplusPoints = 20;
      surplusStatus = 'Cash Flow Deficit';
    }

    // Calculate final score (0 - 100)
    const finalScore = dtiPoints + loanPoints + efPoints + surplusPoints;

    // Map score to category:
    // 0-30 = Healthy
    // 31-60 = Moderate Risk
    // 61-100 = High Risk
    let rating = 'Healthy';
    let recommendations = [];

    if (finalScore <= 30) {
      rating = 'Healthy';
      recommendations.push("Maintain your current budget and continue building your savings.");
      if (loanCount > 0) {
        recommendations.push("Consider making small extra payments to become fully debt-free faster.");
      }
    } else if (finalScore <= 60) {
      rating = 'Moderate Risk';
      recommendations.push("Try to cut down discretionary spending to increase your monthly surplus.");
      if (efMonths < 3) {
        recommendations.push("Prioritize growing your emergency fund to cover at least 3 months of expenses.");
      }
      if (dti > 35) {
        recommendations.push("Avoid taking on any new loans or credit card debt.");
      }
    } else {
      rating = 'High Risk';
      recommendations.push("Review and slash non-essential expenses immediately to stop cash deficit.");
      recommendations.push("Implement the Debt Avalanche or Snowball method using any extra cash.");
      if (efMonths < 1) {
        recommendations.push("Immediately focus on putting aside a small starter emergency fund (at least 1 month expenses).");
      }
      recommendations.push("Consider debt consolidation or negotiating interest rates with your lenders.");
    }

    return {
      score: finalScore,
      rating,
      metrics: {
        debtToIncomeRatio: {
          value: Math.round(dti * 100) / 100,
          points: dtiPoints,
          status: dtiStatus
        },
        loanCount: {
          value: loanCount,
          points: loanPoints,
          status: loanStatus
        },
        emergencyFundMonths: {
          value: Math.round(efMonths * 100) / 100,
          points: efPoints,
          status: efStatus
        },
        surplusRatio: {
          value: Math.round(surplusRatio * 100) / 100,
          points: surplusPoints,
          status: surplusStatus
        }
      },
      recommendations
    };
  }
}

module.exports = HealthScoreService;
