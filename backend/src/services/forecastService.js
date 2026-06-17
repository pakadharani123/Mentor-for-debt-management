const SimulatorService = require('./simulatorService');
const DebtStrategyService = require('./debtStrategyService');

/**
 * Forecast Service
 * Projects the overall debt payoff timeline and remaining interest costs.
 * All operations are computed programmatically on the backend.
 */
class ForecastService {
  /**
   * Generates a comprehensive forecast for active loans
   * @param {Array} loans - List of active loan records
   * @param {Object} profile - User's financial profile
   */
  static generateForecast(loans, profile) {
    if (!loans || loans.length === 0) {
      return {
        estimatedDebtFreeDate: new Date(),
        totalInterestRemaining: 0,
        recommendedMonthlyPayment: 0,
        payoffMonthsRemaining: 0,
        remainingPrincipal: 0
      };
    }

    const remainingPrincipal = loans.reduce((sum, l) => sum + l.remainingAmount, 0);
    const totalEMI = loans.reduce((sum, l) => sum + l.emi, 0);

    // 1. Calculate remaining interest & tenure for each loan under minimum payments
    let totalInterestRemaining = 0;
    let payoffMonthsRemaining = 0;

    loans.forEach(loan => {
      const sim = SimulatorService.simulateAmortization(
        loan.remainingAmount,
        loan.interestRate,
        loan.emi
      );

      if (!sim.unsustainable) {
        totalInterestRemaining += sim.totalInterestPaid;
        if (sim.months > payoffMonthsRemaining) {
          payoffMonthsRemaining = sim.months;
        }
      } else {
        // If a single loan is unsustainable, interest is infinite
        totalInterestRemaining = Infinity;
        payoffMonthsRemaining = Infinity;
      }
    });

    // 2. Compute recommended accelerated repayment amount
    let recommendedExtra = 0;
    if (profile) {
      const surplus = profile.monthlyIncome - profile.monthlyExpenses - totalEMI;
      if (surplus > 0) {
        // Recommend allocating 50% of monthly surplus to extra debt payoff
        recommendedExtra = surplus * 0.5;
      } else {
        // If in deficit, recommend cutting budget to allocate 10% of monthly income to debt
        recommendedExtra = Math.max(1500, profile.monthlyIncome * 0.1);
      }
    } else {
      // Fallback: Recommend a 20% bump in minimum EMIs
      recommendedExtra = totalEMI * 0.2;
    }

    const recommendedMonthlyPayment = totalEMI + recommendedExtra;

    // 3. Compute accelerated debt-free date using recommended payment in Avalanche strategy
    let estimatedDebtFreeDate = new Date();
    if (payoffMonthsRemaining !== Infinity && payoffMonthsRemaining > 0) {
      // Map loans for strategy simulator
      const simLoans = loans.map(l => ({
        id: l._id ? l._id.toString() : Math.random().toString(),
        name: l.loanName,
        principal: l.principalAmount,
        balance: l.remainingAmount,
        rate: l.interestRate,
        emi: l.emi
      }));

      // Run simulation under recommended extra payment
      const strategySim = DebtStrategyService.simulate(simLoans, recommendedExtra, 'avalanche');
      
      estimatedDebtFreeDate.setMonth(estimatedDebtFreeDate.getMonth() + strategySim.totalMonths);
    } else {
      estimatedDebtFreeDate = null; // represents unsustainable payoff timeline
    }

    return {
      remainingPrincipal: Math.round(remainingPrincipal * 100) / 100,
      totalInterestRemaining: totalInterestRemaining === Infinity ? -1 : Math.round(totalInterestRemaining * 100) / 100,
      recommendedMonthlyPayment: Math.round(recommendedMonthlyPayment * 100) / 100,
      payoffMonthsRemaining: payoffMonthsRemaining === Infinity ? -1 : payoffMonthsRemaining,
      estimatedDebtFreeDate
    };
  }
}

module.exports = ForecastService;
