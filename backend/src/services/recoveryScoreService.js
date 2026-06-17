/**
 * Financial Recovery Score Service
 * Evaluates the user's financial posture and resilience on a scale of 0 to 100.
 * Category mapping:
 * - 0-30 = Critical
 * - 31-50 = High Risk
 * - 51-70 = Recovering
 * - 71-85 = Stable
 * - 86-100 = Excellent
 */
class RecoveryScoreService {
  /**
   * Computes the recovery score based on 7 factors
   * @param {Object} params
   * @param {Number} params.income - Monthly Income
   * @param {Number} params.expenses - Monthly Expenses
   * @param {Number} params.savings - Total Savings Balance
   * @param {Number} params.emergencyFund - Emergency Fund Balance
   * @param {Number} params.totalEMI - Sum of all loan EMIs
   * @param {Number} params.loanCount - Number of active loans
   * @param {Array} params.paymentsHistory - Array of PaymentHistory records
   */
  static calculateScore({
    income,
    expenses,
    savings,
    emergencyFund,
    totalEMI,
    loanCount,
    paymentsHistory = []
  }) {
    const monthlyIncome = Math.max(1, income);
    const monthlyExpenses = Math.max(1, expenses);

    // --- Factor 1: Debt-to-Income (DTI) Ratio (Max 20 points) ---
    const dti = (totalEMI / monthlyIncome) * 100;
    let dtiPoints = 0;
    if (dti <= 20) dtiPoints = 20;
    else if (dti <= 35) dtiPoints = 15;
    else if (dti <= 50) dtiPoints = 8;
    else dtiPoints = 2;

    // --- Factor 2: Monthly Savings Ratio (Max 15 points) ---
    const savingsRatio = (savings / monthlyIncome) * 100;
    let savingsPoints = 0;
    if (savingsRatio >= 20) savingsPoints = 15;
    else if (savingsRatio >= 10) savingsPoints = 10;
    else if (savingsRatio >= 5) savingsPoints = 5;
    else savingsPoints = 1;

    // --- Factor 3: Emergency Fund Sufficiency (Max 15 points) ---
    const efMonths = emergencyFund / monthlyExpenses;
    let efPoints = 0;
    if (efMonths >= 6) efPoints = 15;
    else if (efMonths >= 3) efPoints = 10;
    else if (efMonths >= 1) efPoints = 5;
    else efPoints = 0;

    // --- Factor 4: Number of Active Loans (Max 10 points) ---
    let loanPoints = 0;
    if (loanCount <= 1) loanPoints = 10;
    else if (loanCount === 2) loanPoints = 7;
    else if (loanCount <= 4) loanPoints = 4;
    else loanPoints = 1;

    // --- Factor 5: EMI Burden (Max 10 points) ---
    // EMI relative to monthly expenses
    const emiBurden = (totalEMI / monthlyExpenses) * 100;
    let emiBurdenPoints = 0;
    if (emiBurden <= 20) emiBurdenPoints = 10;
    else if (emiBurden <= 50) emiBurdenPoints = 7;
    else if (emiBurden <= 80) emiBurdenPoints = 4;
    else emiBurdenPoints = 1;

    // --- Factor 6: Payment History Compliance (Max 15 points) ---
    let compliance = 100;
    let compliancePoints = 15;
    if (paymentsHistory && paymentsHistory.length > 0) {
      const paidCount = paymentsHistory.filter(p => p.status === 'Paid').length;
      compliance = (paidCount / paymentsHistory.length) * 100;
      
      if (compliance >= 95) compliancePoints = 15;
      else if (compliance >= 80) compliancePoints = 10;
      else if (compliance >= 60) compliancePoints = 5;
      else compliancePoints = 0;
    }

    // --- Factor 7: Monthly Surplus Ratio (Max 15 points) ---
    const surplus = monthlyIncome - monthlyExpenses - totalEMI;
    const surplusRatio = (surplus / monthlyIncome) * 100;
    let surplusPoints = 0;
    if (surplusRatio >= 20) surplusPoints = 15;
    else if (surplusRatio >= 10) surplusPoints = 10;
    else if (surplusRatio >= 0) surplusPoints = 5;
    else surplusPoints = 0;

    // Calculate total score
    const finalScore = dtiPoints + savingsPoints + efPoints + loanPoints + emiBurdenPoints + compliancePoints + surplusPoints;

    // Determine category
    let category = 'Critical';
    if (finalScore <= 30) category = 'Critical';
    else if (finalScore <= 50) category = 'High Risk';
    else if (finalScore <= 70) category = 'Recovering';
    else if (finalScore <= 85) category = 'Stable';
    else category = 'Excellent';

    // Strengths, Weaknesses, and Suggestions
    const strengths = [];
    const weaknesses = [];
    const improvementSuggestions = [];

    // Strengths evaluations
    if (dtiPoints >= 15) strengths.push('Strong debt-to-income control (DTI <= 35%)');
    if (savingsPoints >= 10) strengths.push('Healthy monthly savings rate');
    if (efPoints >= 10) strengths.push('Comfortable cash reserve (covers >= 3 months of expenses)');
    if (compliancePoints >= 15) strengths.push('Excellent loan payment compliance');
    if (surplusPoints >= 10) strengths.push('Solid cash flow surplus each month');

    // Weaknesses evaluations
    if (dtiPoints <= 8) weaknesses.push('High debt burden relative to income (DTI > 35%)');
    if (savingsPoints <= 1) weaknesses.push('Critically low savings rate');
    if (efPoints <= 5) weaknesses.push('Inadequate emergency reserve (covers < 3 months of expenses)');
    if (loanPoints <= 4) weaknesses.push(`High number of active loans (${loanCount})`);
    if (compliancePoints <= 10) weaknesses.push(`Inconsistent payment history (Compliance: ${compliance.toFixed(1)}%)`);
    if (surplusPoints === 0) weaknesses.push('Monthly budget deficit (outflow exceeds income)');

    // Recommendations
    if (efPoints < 10) {
      improvementSuggestions.push('Prioritize building a basic emergency fund covering 3 to 6 months of expenses.');
    }
    if (dtiPoints < 15) {
      improvementSuggestions.push('Implement debt strategies like Snowball or Avalanche to reduce your DTI ratio.');
    }
    if (surplusPoints === 0) {
      improvementSuggestions.push('Identify and cut non-essential expenses to eliminate your cash flow deficit.');
    }
    if (compliancePoints < 15) {
      improvementSuggestions.push('Automate your loan EMI payments to protect your credit history and score.');
    }
    if (loanCount > 3) {
      improvementSuggestions.push('Consider debt consolidation to combine multiple small accounts into a single loan.');
    }

    // Default suggestions if none triggered
    if (improvementSuggestions.length === 0) {
      improvementSuggestions.push('Maintain your excellent financial habits and allocate surplus to long-term wealth investments.');
    }

    return {
      score: finalScore,
      category,
      strengths,
      weaknesses,
      improvementSuggestions,
      factors: {
        debtToIncomeRatio: { value: Math.round(dti * 100) / 100, score: dtiPoints },
        savingsRatio: { value: Math.round(savingsRatio * 100) / 100, score: savingsPoints },
        emergencyFundMonths: { value: Math.round(efMonths * 100) / 100, score: efPoints },
        loanCount: { value: loanCount, score: loanPoints },
        emiBurdenRatio: { value: Math.round(emiBurden * 100) / 100, score: emiBurdenPoints },
        paymentCompliance: { value: Math.round(compliance * 100) / 100, score: compliancePoints },
        surplusRatio: { value: Math.round(surplusRatio * 100) / 100, score: surplusPoints }
      }
    };
  }
}

module.exports = RecoveryScoreService;
