/**
 * Unit Tests for Simulator and Forecast Engines
 * Executable via `node test.js`
 */
const assert = require('assert');
const SimulatorService = require('./src/services/simulatorService');
const ForecastService = require('./src/services/forecastService');

const runTests = () => {
  console.log('\x1b[36m%s\x1b[0m', 'Running Backend Mathematical Service Unit Tests...\n');
  let passed = 0;
  let failed = 0;

  const test = (title, fn) => {
    try {
      fn();
      console.log(`✅ Passed: ${title}`);
      passed++;
    } catch (error) {
      console.error(`❌ Failed: ${title}`);
      console.error(error);
      failed++;
    }
  };

  // --- 1. Simulator Service Tests ---
  test('Simulator: Standard Amortization Simulation Math', () => {
    // Principal: 100,000, Interest Rate: 12% (1% monthly), EMI: 10,000
    const sim = SimulatorService.simulateAmortization(100000, 12, 10000);
    
    assert.strictEqual(sim.unsustainable, false);
    // Calculated month-by-month:
    // Month 1: Interest 1000, Balance after Interest 101000, Pay 10000, Balance 91000
    // Month 11: Balance after interest 9090, Pay 9090, Balance 0
    assert.strictEqual(sim.months, 11);
    assert.ok(sim.totalInterestPaid > 5000 && sim.totalInterestPaid < 6500);
  });

  test('Simulator: Unsustainable EMI Assessment', () => {
    // Principal: 100,000, Interest Rate: 12% (1,000 monthly interest), EMI: 900
    const sim = SimulatorService.simulateAmortization(100000, 12, 900);
    
    assert.strictEqual(sim.unsustainable, true);
    assert.strictEqual(sim.months, Infinity);
    assert.strictEqual(sim.totalInterestPaid, Infinity);
  });

  test('Simulator: Comparative Simulator proposed vs current EMI', () => {
    const mockLoan = {
      remainingAmount: 100000,
      interestRate: 12
    };

    const results = SimulatorService.simulateProposedEmi(mockLoan, 5000, 10000);

    assert.strictEqual(results.currentPayoffMonths, 23);
    assert.strictEqual(results.newPayoffMonths, 11);
    assert.strictEqual(results.monthsReduced, 12);
    assert.ok(results.interestSaved > 0);
    assert.ok(results.newPayoffDate instanceof Date);
  });

  // --- 2. Forecast Service Tests ---
  test('Forecast: Aggregations & Tenures', () => {
    const mockLoans = [
      {
        _id: '1',
        loanName: 'Vehicle Loan',
        principalAmount: 200000,
        remainingAmount: 100000,
        interestRate: 12,
        emi: 5000
      },
      {
        _id: '2',
        loanName: 'Hand Loan',
        principalAmount: 50000,
        remainingAmount: 20000,
        interestRate: 12,
        emi: 2000
      }
    ];

    const mockProfile = {
      monthlyIncome: 60000,
      monthlyExpenses: 25000
    };

    const forecast = ForecastService.generateForecast(mockLoans, mockProfile);

    // Sum of remaining amounts = 120,000
    assert.strictEqual(forecast.remainingPrincipal, 120000);
    // Loan 1 min payoff: 24 months, Loan 2 min payoff: 11 months. Portfolio max = 24 months
    assert.strictEqual(forecast.payoffMonthsRemaining, 23);
    
    // Recommended monthly payment:
    // EMIs = 7,000. Surplus = 60,000 - 25,000 - 7,000 = 28,000.
    // Recommended extra = 28,000 * 0.5 = 14,000.
    // Recommended total payment = 7,000 + 14,000 = 21,000.
    assert.strictEqual(forecast.recommendedMonthlyPayment, 21000);
    assert.ok(forecast.estimatedDebtFreeDate instanceof Date);
  });

  test('Forecast: Deficit Surplus Recommendation adjustment', () => {
    const mockLoans = [
      {
        _id: '1',
        loanName: 'Vehicle Loan',
        principalAmount: 200000,
        remainingAmount: 100000,
        interestRate: 12,
        emi: 5000
      }
    ];

    // High expenses leading to deficit
    const mockProfile = {
      monthlyIncome: 30000,
      monthlyExpenses: 28000
    };

    const forecast = ForecastService.generateForecast(mockLoans, mockProfile);

    // EMIs = 5000. Surplus = 30000 - 28000 - 5000 = -3000 (deficit)
    // Recommended extra: 10% of income = 3,000
    // Recommended total payment = 5,000 + 3,000 = 8,000
    assert.strictEqual(forecast.recommendedMonthlyPayment, 8000);
  });

  console.log(`\nTesting completed. Passed: ${passed}, Failed: ${failed}`);
  
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTests();
