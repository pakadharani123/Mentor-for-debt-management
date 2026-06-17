/**
 * Simulator Service
 * Handles mathematical loan payoff calculations based on different EMI amounts.
 * Runs exact month-by-month amortization. AI is excluded from these calculations.
 */
class SimulatorService {
  /**
   * Run month-by-month simulation for a single loan
   * @param {Number} balance - Current remaining loan amount
   * @param {Number} annualRate - Annual interest rate (percentage)
   * @param {Number} emi - EMI amount to simulate
   */
  static simulateAmortization(balance, annualRate, emi) {
    const monthlyRate = (annualRate / 12) / 100;
    let currentBalance = balance;
    let months = 0;
    let totalInterest = 0;
    const maxMonths = 360; // 30 years safety cutoff

    // If EMI is less than or equal to first month's interest, debt grows infinitely
    if (balance * monthlyRate >= emi) {
      return {
        months: Infinity,
        totalInterestPaid: Infinity,
        unsustainable: true
      };
    }

    while (currentBalance > 0 && months < maxMonths) {
      months++;
      const interest = currentBalance * monthlyRate;
      totalInterest += interest;
      currentBalance += interest;
      
      const payment = Math.min(emi, currentBalance);
      currentBalance -= payment;
    }

    return {
      months,
      totalInterestPaid: Math.round(totalInterest * 100) / 100,
      unsustainable: false
    };
  }

  /**
   * Run comparative simulation for current vs proposed EMIs
   * @param {Object} loan - Loan details
   * @param {Number} currentEmi - Current EMI payment
   * @param {Number} proposedEmi - Proposed EMI payment
   */
  static simulateProposedEmi(loan, currentEmi, proposedEmi) {
    const balance = loan.remainingAmount;
    const rate = loan.interestRate;

    const currentSim = this.simulateAmortization(balance, rate, currentEmi);
    const proposedSim = this.simulateAmortization(balance, rate, proposedEmi);

    if (currentSim.unsustainable) {
      return {
        currentPayoffMonths: -1, // Represents unsustainable debt
        newPayoffMonths: proposedSim.unsustainable ? -1 : proposedSim.months,
        monthsReduced: 0,
        interestSaved: 0,
        newPayoffDate: null,
        error: "Current EMI is too low to cover monthly interest. Debt is unsustainable."
      };
    }

    if (proposedSim.unsustainable) {
      return {
        currentPayoffMonths: currentSim.months,
        newPayoffMonths: -1,
        monthsReduced: 0,
        interestSaved: 0,
        newPayoffDate: null,
        error: "Proposed EMI is too low to cover monthly interest."
      };
    }

    const monthsReduced = Math.max(0, currentSim.months - proposedSim.months);
    const interestSaved = Math.max(0, currentSim.totalInterestPaid - proposedSim.totalInterestPaid);

    const newPayoffDate = new Date();
    newPayoffDate.setMonth(newPayoffDate.getMonth() + proposedSim.months);

    return {
      currentPayoffMonths: currentSim.months,
      newPayoffMonths: proposedSim.months,
      monthsReduced,
      interestSaved: Math.round(interestSaved * 100) / 100,
      newPayoffDate
    };
  }
}

module.exports = SimulatorService;
