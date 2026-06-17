/**
 * Debt Repayment Engine Service
 * Simulates month-by-month debt paydown for:
 * 1. Debt Snowball (smallest balance first)
 * 2. Debt Avalanche (highest interest first)
 */
class DebtStrategyService {
  /**
   * Run repayment simulation
   * @param {Array} loans - List of loan objects
   * @param {Number} monthlySurplus - Extra money available to pay off debt beyond EMIs
   */
  static generateRepaymentPlans(loans, monthlySurplus = 0) {
    if (!loans || loans.length === 0) {
      return {
        snowballPlan: { totalMonths: 0, totalInterestPaid: 0, schedule: [] },
        avalanchePlan: { totalMonths: 0, totalInterestPaid: 0, schedule: [] },
        recommendedStrategy: "None",
        estimatedMonths: 0
      };
    }

    const surplusAmount = Math.max(0, monthlySurplus);

    // Deep copy loans for both simulations
    const snowballLoans = loans.map(l => ({
      id: l._id ? l._id.toString() : Math.random().toString(),
      name: l.loanName,
      principal: l.principalAmount,
      balance: l.remainingAmount,
      rate: l.interestRate,
      emi: l.emi
    })).filter(l => l.balance > 0);

    const avalancheLoans = JSON.parse(JSON.stringify(snowballLoans));

    // Run simulations
    const snowballResult = this.simulate(snowballLoans, surplusAmount, "snowball");
    const avalancheResult = this.simulate(avalancheLoans, surplusAmount, "avalanche");

    // Recommendation logic
    let recommendedStrategy = "Debt Avalanche";
    let estimatedMonths = avalancheResult.totalMonths;
    let description = "We recommend the Debt Avalanche method because it targets high-interest debt first, mathematically saving you the most money in interest payments.";

    if (snowballResult.totalMonths < avalancheResult.totalMonths) {
      recommendedStrategy = "Debt Snowball";
      estimatedMonths = snowballResult.totalMonths;
      description = "We recommend the Debt Snowball method here because it eliminates your individual loans faster, which boosts motivation and frees up minimum payment cashflow quickly.";
    } else if (avalancheResult.totalInterestPaid === snowballResult.totalInterestPaid) {
      recommendedStrategy = "Debt Snowball";
      estimatedMonths = snowballResult.totalMonths;
      description = "Both strategies cost the same, so we recommend the Debt Snowball method to quickly eliminate smaller loan accounts and keep you motivated.";
    } else {
      const interestSaved = snowballResult.totalInterestPaid - avalancheResult.totalInterestPaid;
      if (interestSaved < 500 && snowballResult.totalMonths <= avalancheResult.totalMonths + 2) {
        // If interest savings are minimal, suggest Snowball for psychological benefits
        recommendedStrategy = "Debt Snowball";
        estimatedMonths = snowballResult.totalMonths;
        description = "While Debt Avalanche mathematically saves a tiny amount, the Debt Snowball strategy clears individual loans faster, which provides a strong psychological boost for a minor difference in interest.";
      }
    }

    return {
      snowballPlan: {
        totalMonths: snowballResult.totalMonths,
        totalInterestPaid: Math.round(snowballResult.totalInterestPaid * 100) / 100,
        schedule: snowballResult.schedule
      },
      avalanchePlan: {
        totalMonths: avalancheResult.totalMonths,
        totalInterestPaid: Math.round(avalancheResult.totalInterestPaid * 100) / 100,
        schedule: avalancheResult.schedule
      },
      recommendedStrategy,
      estimatedMonths,
      recommendationReason: description
    };
  }

  /**
   * Simulate repayment strategy
   */
  static simulate(loans, monthlySurplus, strategyType) {
    let activeLoans = [...loans];
    let totalInterestPaid = 0;
    let months = 0;
    const schedule = [];
    const maxMonths = 360; // 30 years safety cutoff to prevent infinite loops

    while (activeLoans.length > 0 && months < maxMonths) {
      months++;
      let monthlyInterest = 0;
      let emiRequirements = 0;

      // 1. Accrue interest for the month
      activeLoans.forEach(loan => {
        const monthlyRate = (loan.rate / 12) / 100;
        const interest = loan.balance * monthlyRate;
        loan.accruedInterestThisMonth = interest;
        loan.balance += interest;
        monthlyInterest += interest;
        emiRequirements += loan.emi;
      });

      totalInterestPaid += monthlyInterest;

      // Total available cash is the sum of EMIs for active loans + the extra surplus
      let totalCashAvailable = emiRequirements + monthlySurplus;
      let monthPayments = [];

      // 2. Pay off minimum EMIs first
      activeLoans.forEach(loan => {
        // Minimum payment is the lesser of the EMI or the remaining loan balance
        const payment = Math.min(loan.emi, loan.balance);
        loan.balance -= payment;
        totalCashAvailable -= payment;
        
        monthPayments.push({
          loanId: loan.id,
          loanName: loan.name,
          interestAccrued: Math.round(loan.accruedInterestThisMonth * 100) / 100,
          regularPayment: Math.round(payment * 100) / 100,
          extraPayment: 0,
          remainingBalance: Math.round(loan.balance * 100) / 100
        });
      });

      // 3. Allocate remaining extra cash (including surplus and leftover EMI cash)
      if (totalCashAvailable > 0 && activeLoans.length > 0) {
        // Sort active loans according to strategy
        if (strategyType === "snowball") {
          // Smallest remaining balance first
          activeLoans.sort((a, b) => a.balance - b.balance);
        } else {
          // Highest interest rate first, breaking ties with smallest balance
          activeLoans.sort((a, b) => {
            if (b.rate !== a.rate) {
              return b.rate - a.rate;
            }
            return a.balance - b.balance;
          });
        }

        // Apply surplus to sorted active loans in order
        for (let i = 0; i < activeLoans.length; i++) {
          const loan = activeLoans[i];
          if (loan.balance > 0 && totalCashAvailable > 0) {
            const extraPay = Math.min(totalCashAvailable, loan.balance);
            loan.balance -= extraPay;
            totalCashAvailable -= extraPay;

            // Find payment object and update extra payment
            const payObj = monthPayments.find(p => p.loanId === loan.id);
            if (payObj) {
              payObj.extraPayment = Math.round((payObj.extraPayment + extraPay) * 100) / 100;
              payObj.remainingBalance = Math.round(loan.balance * 100) / 100;
            }
          }
        }
      }

      // Add to schedule summary
      schedule.push({
        month: months,
        payments: monthPayments,
        remainingDebt: Math.round(activeLoans.reduce((sum, l) => sum + l.balance, 0) * 100) / 100,
        interestPaidThisMonth: Math.round(monthlyInterest * 100) / 100
      });

      // Remove paid off loans
      activeLoans = activeLoans.filter(l => l.balance > 0);
    }

    return {
      totalMonths: months,
      totalInterestPaid,
      schedule
    };
  }
}

module.exports = DebtStrategyService;
